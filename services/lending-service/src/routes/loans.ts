import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';

export const loansRouter = Router();

const loanApplicationSchema = z.object({
  loanType: z.enum(['personal', 'auto', 'home_improvement', 'debt_consolidation', 'small_business', 'credit_builder']),
  requestedAmount: z.number().min(500).max(500000),
  requestedTermMonths: z.enum(['12', '24', '36', '48', '60', '72', '84']).transform(Number),
  loanPurpose: z.string().min(1).max(500),
  annualIncome: z.number().positive(),
  monthlyDebtPayments: z.number().min(0),
  employmentStatus: z.enum(['employed', 'self_employed', 'retired', 'unemployed', 'student']),
  employmentLengthMonths: z.number().min(0),
  creditScoreConsent: z.boolean().refine(v => v === true, { message: 'Credit score consent is required' }),
  collateralValue: z.number().positive().optional(),
});

// --- POST /loans/apply ---
loansRouter.post('/apply', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = loanApplicationSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    // Check for existing pending applications
    const pendingApp = await db('loan_applications')
      .where({ user_id: userId, tenant_id: tenantId })
      .whereIn('status', ['submitted', 'under_review', 'approved'])
      .first();

    if (pendingApp) {
      res.status(409).json({
        type: 'https://api.neobank.io/errors/conflict',
        title: 'Active Application',
        status: 409,
        detail: `You have an active loan application (${pendingApp.id}) in '${pendingApp.status}' status.`,
      });
      return;
    }

    const applicationId = uuidv4();
    await db('loan_applications').insert({
      id: applicationId,
      tenant_id: tenantId,
      user_id: userId,
      loan_type: parsed.data.loanType,
      requested_amount: parsed.data.requestedAmount,
      requested_term_months: parsed.data.requestedTermMonths,
      loan_purpose: parsed.data.loanPurpose,
      annual_income: parsed.data.annualIncome,
      monthly_debt_payments: parsed.data.monthlyDebtPayments,
      employment_status: parsed.data.employmentStatus,
      employment_length_months: parsed.data.employmentLengthMonths,
      credit_score_consent: true,
      collateral_value: parsed.data.collateralValue || null,
      status: 'submitted',
      submitted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Audit log
    await db('audit_log').insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: userId,
      action: 'loan_application_submitted',
      resource_type: 'loan_application',
      resource_id: applicationId,
      before_state: null,
      after_state: {
        loanType: parsed.data.loanType,
        requestedAmount: parsed.data.requestedAmount,
        requestedTermMonths: parsed.data.requestedTermMonths,
      },
      ip_address: req.ip || null,
      created_at: new Date(),
    });

    logger.info('Loan application submitted', {
      userId,
      tenantId,
      applicationId,
      loanType: parsed.data.loanType,
      amount: parsed.data.requestedAmount,
    });

    res.status(201).json({
      success: true,
      data: {
        applicationId,
        status: 'submitted',
        loanType: parsed.data.loanType,
        requestedAmount: parsed.data.requestedAmount,
        requestedTermMonths: parsed.data.requestedTermMonths,
        message: 'Your application has been submitted and will be reviewed shortly.',
      },
    });
  } catch (error) {
    logger.error('Failed to submit loan application', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to submit loan application.',
    });
  }
});

// --- GET /loans ---
loansRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const loans = await db('loans')
      .where({ user_id: userId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: loans.map((l: Record<string, unknown>) => ({
        id: l.id,
        applicationId: l.application_id,
        loanType: l.loan_type,
        principalAmount: l.principal_amount,
        currentBalance: l.current_balance,
        interestRate: l.interest_rate,
        termMonths: l.term_months,
        monthlyPayment: l.monthly_payment,
        status: l.status,
        nextPaymentDate: l.next_payment_date,
        nextPaymentAmount: l.next_payment_amount,
        totalPaid: l.total_paid,
        totalInterestPaid: l.total_interest_paid,
        riskGrade: l.risk_grade,
        originatedAt: l.originated_at,
        maturityDate: l.maturity_date,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch loans', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch loans.',
    });
  }
});

// --- GET /loans/:id ---
loansRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const loan = await db('loans')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId })
      .first();

    if (!loan) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Loan not found.',
      });
      return;
    }

    // Get payment history
    const payments = await db('loan_payments')
      .where({ loan_id: loan.id, tenant_id: tenantId })
      .orderBy('due_date', 'desc')
      .limit(24);

    // Get amortization schedule
    const schedule = await db('loan_amortization_schedule')
      .where({ loan_id: loan.id })
      .orderBy('payment_number', 'asc');

    res.json({
      success: true,
      data: {
        loan: {
          id: loan.id,
          loanType: loan.loan_type,
          principalAmount: loan.principal_amount,
          currentBalance: loan.current_balance,
          interestRate: loan.interest_rate,
          termMonths: loan.term_months,
          monthlyPayment: loan.monthly_payment,
          status: loan.status,
          nextPaymentDate: loan.next_payment_date,
          nextPaymentAmount: loan.next_payment_amount,
          totalPaid: loan.total_paid,
          totalInterestPaid: loan.total_interest_paid,
          riskGrade: loan.risk_grade,
          originatedAt: loan.originated_at,
          maturityDate: loan.maturity_date,
        },
        payments: payments.map((p: Record<string, unknown>) => ({
          id: p.id,
          dueDate: p.due_date,
          amount: p.amount,
          principalPortion: p.principal_portion,
          interestPortion: p.interest_portion,
          status: p.status,
          paidAt: p.paid_at,
        })),
        amortizationSchedule: schedule.map((s: Record<string, unknown>) => ({
          paymentNumber: s.payment_number,
          dueDate: s.due_date,
          payment: s.payment_amount,
          principal: s.principal_portion,
          interest: s.interest_portion,
          balance: s.remaining_balance,
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch loan details', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch loan details.',
    });
  }
});

// --- GET /loans/applications ---
loansRouter.get('/applications/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const applications = await db('loan_applications')
      .where({ user_id: userId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: applications.map((a: Record<string, unknown>) => ({
        id: a.id,
        loanType: a.loan_type,
        requestedAmount: a.requested_amount,
        requestedTermMonths: a.requested_term_months,
        status: a.status,
        approvedAmount: a.approved_amount,
        approvedRate: a.approved_rate,
        approvedTermMonths: a.approved_term_months,
        monthlyPayment: a.monthly_payment,
        riskGrade: a.risk_grade,
        decisionAt: a.decision_at,
        submittedAt: a.submitted_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch loan applications', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch loan applications.',
    });
  }
});

// --- POST /loans/:id/payoff-quote ---
loansRouter.post('/:id/payoff-quote', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const loan = await db('loans')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!loan) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Active loan not found.',
      });
      return;
    }

    // Calculate payoff amount (current balance + accrued interest)
    const dailyRate = loan.interest_rate / 365;
    const lastPaymentDate = loan.last_payment_date || loan.originated_at;
    const daysSincePayment = Math.floor(
      (Date.now() - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24),
    );
    const accruedInterest = loan.current_balance * dailyRate * daysSincePayment;
    const payoffAmount = Math.round((loan.current_balance + accruedInterest) * 100) / 100;

    // Quote valid for 10 days
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 10);

    res.json({
      success: true,
      data: {
        loanId: loan.id,
        currentBalance: loan.current_balance,
        accruedInterest: Math.round(accruedInterest * 100) / 100,
        payoffAmount,
        validUntil: validUntil.toISOString(),
        daysSinceLastPayment: daysSincePayment,
      },
    });
  } catch (error) {
    logger.error('Failed to generate payoff quote', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to generate payoff quote.',
    });
  }
});
