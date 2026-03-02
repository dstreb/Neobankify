import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';

export const paymentsRouter = Router();

// --- POST /payments ---
paymentsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      loanId: z.string().uuid(),
      amount: z.number().positive(),
      paymentMethod: z.enum(['ach', 'debit_card', 'check', 'auto_pay']).default('ach'),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    // Wrap entire payment processing in a transaction with row-level locking
    // to prevent concurrent payments from corrupting the loan balance
    const result = await db.transaction(async (trx) => {
      // Lock the loan row to prevent concurrent reads of stale balance
      const loan = await trx('loans')
        .where({ id: parsed.data.loanId, user_id: userId, tenant_id: tenantId, status: 'active' })
        .forUpdate()
        .first();

      if (!loan) {
        return { notFound: true } as const;
      }

      // Calculate interest allocation
      // loan.apr is stored as percentage (e.g. 5.99), convert to decimal for calculation
      const dailyRate = (loan.apr / 100) / 365;
      const lastPaymentDate = loan.next_payment_date || loan.funded_at;
      const daysSincePayment = Math.floor(
        (Date.now() - new Date(lastPaymentDate).getTime()) / (1000 * 60 * 60 * 24),
      );
      const accruedInterest = Math.round(loan.current_balance * dailyRate * daysSincePayment * 100) / 100;

      const interestPortion = Math.min(parsed.data.amount, accruedInterest);
      const principalPortion = Math.round((parsed.data.amount - interestPortion) * 100) / 100;
      const newBalance = Math.max(0, Math.round((loan.current_balance - principalPortion) * 100) / 100);

      // Find the next scheduled payment row from the amortization schedule
      // During origination, all payment rows (1..N) are pre-generated with status='scheduled'
      const scheduledPayment = await trx('loan_payments')
        .where({ loan_id: loan.id, tenant_id: tenantId, status: 'scheduled' })
        .orderBy('payment_number', 'asc')
        .first();

      let paymentId: string;

      if (scheduledPayment) {
        // Update the existing scheduled row with actual payment details
        paymentId = scheduledPayment.id as string;
        await trx('loan_payments')
          .where({ id: paymentId })
          .update({
            total_amount: parsed.data.amount,
            principal_amount: principalPortion,
            interest_amount: interestPortion,
            paid_amount: parsed.data.amount,
            paid_date: new Date(),
            remaining_balance: newBalance,
            payment_method: parsed.data.paymentMethod,
            status: 'paid',
            updated_at: new Date(),
          });
      } else {
        // No scheduled payment exists (extra payment beyond schedule)
        const lastPayment = await trx('loan_payments')
          .where({ loan_id: loan.id, tenant_id: tenantId })
          .orderBy('payment_number', 'desc')
          .first();
        const paymentNumber = lastPayment ? (lastPayment.payment_number as number) + 1 : 1;

        paymentId = uuidv4();
        await trx('loan_payments').insert({
          id: paymentId,
          loan_id: loan.id,
          tenant_id: tenantId,
          payment_number: paymentNumber,
          total_amount: parsed.data.amount,
          principal_amount: principalPortion,
          interest_amount: interestPortion,
          paid_amount: parsed.data.amount,
          paid_date: new Date(),
          remaining_balance: newBalance,
          payment_method: parsed.data.paymentMethod,
          status: 'paid',
          due_date: loan.next_payment_date,
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Update loan balance
      const nextPaymentDate = new Date(loan.next_payment_date);
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

      const loanStatus = newBalance <= 0 ? 'paid_off' : 'active';

      await trx('loans')
        .where({ id: loan.id })
        .update({
          current_balance: newBalance,
          total_principal_paid: (loan.total_principal_paid || 0) + principalPortion,
          total_interest_paid: (loan.total_interest_paid || 0) + interestPortion,
          payments_made: (loan.payments_made || 0) + 1,
          payments_remaining: Math.max(0, (loan.payments_remaining || 0) - 1),
          next_payment_date: loanStatus === 'active' ? nextPaymentDate : null,
          next_payment_amount: loanStatus === 'active' ? loan.monthly_payment : null,
          status: loanStatus,
          paid_off_at: loanStatus === 'paid_off' ? new Date() : null,
          updated_at: new Date(),
        });

      // Audit log
      await trx('audit_log').insert({
        id: uuidv4(),
        tenant_id: tenantId,
        user_id: userId,
        event_type: 'audit.immutable',
        action: 'loan_payment_made',
        entity_type: 'loan_payment',
        entity_id: paymentId,
        before_state: { balance: loan.current_balance },
        after_state: {
          balance: newBalance,
          paymentAmount: parsed.data.amount,
          principalPortion,
          interestPortion,
          loanStatus,
        },
        ip_address: req.ip || null,
        created_at: new Date(),
      });

      return {
        notFound: false,
        paymentId,
        loanId: loan.id,
        amount: parsed.data.amount,
        principalPortion,
        interestPortion,
        newBalance,
        loanStatus,
        monthlyPayment: loan.monthly_payment,
      } as const;
    });

    if (result.notFound) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Active loan not found.',
      });
      return;
    }

    const { paymentId, newBalance, loanStatus, principalPortion, interestPortion } = result;

    logger.info('Loan payment processed', {
      userId,
      tenantId,
      paymentId,
      loanId: result.loanId,
      amount: parsed.data.amount,
      newBalance,
    });

    res.status(201).json({
      success: true,
      data: {
        paymentId,
        loanId: result.loanId,
        amount: parsed.data.amount,
        principalPortion,
        interestPortion,
        newBalance,
        loanStatus,
        status: 'processing',
        message: loanStatus === 'paid_off'
          ? 'Congratulations! Your loan has been fully paid off.'
          : `Payment of $${parsed.data.amount} applied. Remaining balance: $${newBalance}.`,
      },
    });
  } catch (error) {
    logger.error('Failed to process payment', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to process loan payment.',
    });
  }
});

// --- GET /payments ---
paymentsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;
    const loanId = req.query.loanId as string | undefined;

    // loan_payments doesn't have user_id — join through loans table
    let query = db('loan_payments')
      .join('loans', 'loan_payments.loan_id', 'loans.id')
      .where({ 'loans.user_id': userId, 'loan_payments.tenant_id': tenantId })
      .select('loan_payments.*');

    if (loanId) query = query.where({ loan_id: loanId });

    const payments = await query.orderBy('loan_payments.created_at', 'desc').limit(100);

    res.json({
      success: true,
      data: payments.map((p: Record<string, unknown>) => ({
        id: p.id,
        loanId: p.loan_id,
        paymentNumber: p.payment_number,
        totalAmount: p.total_amount,
        principalAmount: p.principal_amount,
        interestAmount: p.interest_amount,
        paidAmount: p.paid_amount,
        remainingBalance: p.remaining_balance,
        paymentMethod: p.payment_method,
        status: p.status,
        dueDate: p.due_date,
        paidDate: p.paid_date,
        createdAt: p.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch payments', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch loan payments.',
    });
  }
});

// --- POST /payments/autopay ---
paymentsRouter.post('/autopay', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      loanId: z.string().uuid(),
      enabled: z.boolean(),
      fundingSourceId: z.string().uuid(),
      paymentMethod: z.enum(['ach', 'debit_card', 'check', 'auto_pay']).default('ach'),
      extraPaymentAmount: z.number().min(0).default(0),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    const loan = await db('loans')
      .where({ id: parsed.data.loanId, user_id: userId, tenant_id: tenantId, status: 'active' })
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

    await db('loans')
      .where({ id: loan.id })
      .update({
        auto_pay_enabled: parsed.data.enabled,
        updated_at: new Date(),
      });

    logger.info('Autopay updated', {
      userId,
      tenantId,
      loanId: loan.id,
      enabled: parsed.data.enabled,
    });

    res.json({
      success: true,
      data: {
        loanId: loan.id,
        autopayEnabled: parsed.data.enabled,
        paymentAmount: loan.monthly_payment + parsed.data.extraPaymentAmount,
        fundingSourceId: parsed.data.fundingSourceId,
        message: parsed.data.enabled
          ? `Autopay enabled. $${(loan.monthly_payment + parsed.data.extraPaymentAmount).toFixed(2)} will be debited monthly.`
          : 'Autopay disabled.',
      },
    });
  } catch (error) {
    logger.error('Failed to update autopay', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to update autopay settings.',
    });
  }
});
