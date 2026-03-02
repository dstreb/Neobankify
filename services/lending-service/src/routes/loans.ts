import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';

export const loansRouter = Router();

const loanApplicationSchema = z.object({
  loanProductId: z.string().uuid(),
  requestedAmount: z.number().min(500).max(500000),
  requestedTermMonths: z.enum(['12', '24', '36', '48', '60', '72', '84']).transform(Number),
  purpose: z.string().min(1).max(500),
  annualIncome: z.number().positive(),
  employmentStatus: z.enum(['employed', 'self_employed', 'retired', 'unemployed', 'student']),
  employerName: z.string().max(255).optional(),
  yearsEmployed: z.number().min(0),
  housingStatus: z.enum(['own', 'rent', 'mortgage', 'other']),
  housingPayment: z.number().min(0).optional(),
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

    // Verify loan product exists for this tenant
    const loanProduct = await db('loan_products')
      .where({ id: parsed.data.loanProductId, tenant_id: tenantId, is_active: true })
      .first();

    if (!loanProduct) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Invalid Loan Product',
        status: 400,
        detail: 'The specified loan product is not available.',
      });
      return;
    }

    const applicationId = uuidv4();
    await db('loan_applications').insert({
      id: applicationId,
      tenant_id: tenantId,
      user_id: userId,
      loan_product_id: parsed.data.loanProductId,
      requested_amount: parsed.data.requestedAmount,
      requested_term_months: parsed.data.requestedTermMonths,
      purpose: parsed.data.purpose,
      annual_income: parsed.data.annualIncome,
      employment_status: parsed.data.employmentStatus,
      employer_name: parsed.data.employerName || null,
      years_employed: parsed.data.yearsEmployed,
      housing_status: parsed.data.housingStatus,
      housing_payment: parsed.data.housingPayment || null,
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
        loanProductId: parsed.data.loanProductId,
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
      loanProductId: parsed.data.loanProductId,
      amount: parsed.data.requestedAmount,
    });

    res.status(201).json({
      success: true,
      data: {
        applicationId,
        status: 'submitted',
        loanProductId: parsed.data.loanProductId,
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
        loanProductId: l.loan_product_id,
        loanNumber: l.loan_number,
        principalAmount: l.principal_amount,
        currentBalance: l.current_balance,
        apr: l.apr,
        termMonths: l.term_months,
        monthlyPayment: l.monthly_payment,
        status: l.status,
        nextPaymentDate: l.next_payment_date,
        nextPaymentAmount: l.next_payment_amount,
        totalInterestPaid: l.total_interest_paid,
        totalPrincipalPaid: l.total_principal_paid,
        paymentsMade: l.payments_made,
        paymentsRemaining: l.payments_remaining,
        fundedAt: l.funded_at,
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

    // Get amortization schedule (scheduled payments from loan_payments)
    const schedule = await db('loan_payments')
      .where({ loan_id: loan.id, status: 'scheduled' })
      .orderBy('payment_number', 'asc');

    res.json({
      success: true,
      data: {
        loan: {
          id: loan.id,
          loanProductId: loan.loan_product_id,
          loanNumber: loan.loan_number,
          principalAmount: loan.principal_amount,
          currentBalance: loan.current_balance,
          apr: loan.apr,
          termMonths: loan.term_months,
          monthlyPayment: loan.monthly_payment,
          status: loan.status,
          nextPaymentDate: loan.next_payment_date,
          nextPaymentAmount: loan.next_payment_amount,
          totalInterestPaid: loan.total_interest_paid,
          totalPrincipalPaid: loan.total_principal_paid,
          paymentsMade: loan.payments_made,
          paymentsRemaining: loan.payments_remaining,
          fundedAt: loan.funded_at,
          maturityDate: loan.maturity_date,
        },
        payments: payments.map((p: Record<string, unknown>) => ({
          id: p.id,
          paymentNumber: p.payment_number,
          dueDate: p.due_date,
          totalAmount: p.total_amount,
          principalAmount: p.principal_amount,
          interestAmount: p.interest_amount,
          paidAmount: p.paid_amount,
          remainingBalance: p.remaining_balance,
          paymentMethod: p.payment_method,
          status: p.status,
          paidDate: p.paid_date,
        })),
        amortizationSchedule: schedule.map((s: Record<string, unknown>) => ({
          paymentNumber: s.payment_number,
          dueDate: s.due_date,
          payment: s.payment_amount,
          principal: s.principal_amount,
          interest: s.interest_amount,
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
        loanProductId: a.loan_product_id,
        requestedAmount: a.requested_amount,
        requestedTermMonths: a.requested_term_months,
        status: a.status,
        approvedAmount: a.approved_amount,
        approvedApr: a.approved_apr,
        approvedTermMonths: a.approved_term_months,
        monthlyPayment: a.monthly_payment,
        riskTier: a.risk_tier_at_application,
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
    const dailyRate = loan.apr / 365;
    const lastPaymentDate = loan.next_payment_date || loan.funded_at;
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
