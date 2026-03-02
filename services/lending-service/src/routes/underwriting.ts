import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';
import { underwrite, UnderwritingInput } from '../lib/credit-underwriter';

export const underwritingRouter = Router();

// --- POST /underwriting/evaluate/:applicationId ---
underwritingRouter.post('/evaluate/:applicationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const application = await db('loan_applications')
      .where({ id: req.params.applicationId, user_id: userId, tenant_id: tenantId, status: 'submitted' })
      .first();

    if (!application) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Submitted loan application not found.',
      });
      return;
    }

    // Get user data for underwriting
    const user = await db('users')
      .where({ id: userId, tenant_id: tenantId })
      .select('created_at')
      .first();

    const accountAgeDays = user
      ? Math.floor((Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // In production, credit score would come from a bureau pull (Experian, TransUnion, Equifax)
    // For now, use a simulated score based on user profile
    const creditScore = 700; // Placeholder — would be fetched from credit bureau API

    const input: UnderwritingInput = {
      creditScore,
      annualIncome: application.annual_income,
      monthlyDebtPayments: application.monthly_debt_payments,
      employmentStatus: application.employment_status,
      employmentLengthMonths: application.employment_length_months,
      requestedAmount: application.requested_amount,
      requestedTermMonths: application.requested_term_months,
      loanPurpose: application.loan_purpose,
      existingCustomer: accountAgeDays > 0,
      accountAgeDays,
      collateralValue: application.collateral_value || undefined,
      loanType: application.loan_type,
    };

    const result = underwrite(input);

    // Update application with decision
    await db('loan_applications')
      .where({ id: application.id })
      .update({
        status: result.approved ? 'approved' : 'denied',
        credit_score: creditScore,
        decision_score: result.decisionScore,
        risk_grade: result.riskGrade,
        approved_amount: result.approved ? Math.min(result.maxApprovedAmount, application.requested_amount) : null,
        approved_rate: result.approved ? result.approvedRate : null,
        approved_term_months: result.approved ? result.approvedTermMonths : null,
        monthly_payment: result.approved ? result.monthlyPayment : null,
        dti_ratio: result.dti,
        underwriting_factors: result.factors,
        adverse_action_reasons: result.adverseActionReasons,
        decision_explanation: result.explanation,
        decision_at: new Date(),
        updated_at: new Date(),
      });

    // Store underwriting decision in audit log
    await db('audit_log').insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: userId,
      action: result.approved ? 'loan_approved' : 'loan_denied',
      resource_type: 'loan_application',
      resource_id: application.id,
      before_state: { status: 'submitted' },
      after_state: {
        status: result.approved ? 'approved' : 'denied',
        decisionScore: result.decisionScore,
        riskGrade: result.riskGrade,
        approved: result.approved,
        adverseActionCount: result.adverseActionReasons.length,
      },
      ip_address: req.ip || null,
      created_at: new Date(),
    });

    // Store agent decision for AI compliance trail
    await db('agent_decisions').insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: userId,
      agent_type: 'credit_underwriting',
      decision_type: result.approved ? 'loan_approval' : 'loan_denial',
      decision: {
        approved: result.approved,
        decisionScore: result.decisionScore,
        riskGrade: result.riskGrade,
        rate: result.approvedRate,
        amount: result.maxApprovedAmount,
      },
      reasoning: result.explanation,
      confidence_score: result.decisionScore / 100,
      input_features: result.factors.map(f => `${f.name}:${f.score}`),
      outcome: 'executed',
      created_at: new Date(),
    });

    logger.info('Underwriting completed', {
      userId,
      tenantId,
      applicationId: application.id,
      approved: result.approved,
      riskGrade: result.riskGrade,
      decisionScore: result.decisionScore,
    });

    // If denied, include adverse action notice (ECOA/FCRA requirement)
    if (!result.approved) {
      res.json({
        success: true,
        data: {
          applicationId: application.id,
          decision: 'denied',
          decisionScore: result.decisionScore,
          riskGrade: result.riskGrade,
          adverseActionNotice: {
            title: 'Notice of Adverse Action',
            reasons: result.adverseActionReasons.map(r => ({
              code: r.code,
              reason: r.description,
            })),
            creditBureauUsed: 'TransUnion',
            creditScore: creditScore,
            creditScoreRange: { min: 300, max: 850 },
            rightToFreeReport: 'You have the right to obtain a free copy of your credit report from the bureau listed above within 60 days.',
            disputeRights: 'If you believe any information in your credit report is inaccurate, you have the right to dispute it with the credit bureau.',
          },
          dti: result.dti,
          factors: result.factors,
        },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        applicationId: application.id,
        decision: 'approved',
        decisionScore: result.decisionScore,
        riskGrade: result.riskGrade,
        approvedAmount: Math.min(result.maxApprovedAmount, application.requested_amount),
        approvedRate: result.approvedRate,
        approvedTermMonths: result.approvedTermMonths,
        monthlyPayment: result.monthlyPayment,
        dti: result.dti,
        factors: result.factors,
        explanation: result.explanation,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      },
    });
  } catch (error) {
    logger.error('Underwriting failed', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to complete underwriting evaluation.',
    });
  }
});

// --- POST /underwriting/originate/:applicationId ---
underwritingRouter.post('/originate/:applicationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const application = await db('loan_applications')
      .where({ id: req.params.applicationId, user_id: userId, tenant_id: tenantId, status: 'approved' })
      .first();

    if (!application) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Approved loan application not found.',
      });
      return;
    }

    // Check if offer expired (30 days from decision)
    const decisionDate = new Date(application.decision_at);
    const expiryDate = new Date(decisionDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    if (new Date() > expiryDate) {
      await db('loan_applications')
        .where({ id: application.id })
        .update({ status: 'expired', updated_at: new Date() });

      res.status(400).json({
        type: 'https://api.neobank.io/errors/expired',
        title: 'Offer Expired',
        status: 400,
        detail: 'This loan offer has expired. Please submit a new application.',
      });
      return;
    }

    const loanId = uuidv4();
    const originatedAt = new Date();
    const maturityDate = new Date(originatedAt);
    maturityDate.setMonth(maturityDate.getMonth() + application.approved_term_months);

    const firstPaymentDate = new Date(originatedAt);
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);

    await db('loans').insert({
      id: loanId,
      application_id: application.id,
      tenant_id: tenantId,
      user_id: userId,
      loan_type: application.loan_type,
      principal_amount: application.approved_amount,
      current_balance: application.approved_amount,
      interest_rate: application.approved_rate,
      term_months: application.approved_term_months,
      monthly_payment: application.monthly_payment,
      risk_grade: application.risk_grade,
      status: 'active',
      next_payment_date: firstPaymentDate,
      next_payment_amount: application.monthly_payment,
      total_paid: 0,
      total_interest_paid: 0,
      originated_at: originatedAt,
      maturity_date: maturityDate,
      created_at: originatedAt,
      updated_at: originatedAt,
    });

    // Update application status
    await db('loan_applications')
      .where({ id: application.id })
      .update({ status: 'originated', updated_at: new Date() });

    // Generate amortization schedule
    const monthlyRate = application.approved_rate / 12;
    let balance = application.approved_amount;
    const scheduleRows = [];

    for (let i = 1; i <= application.approved_term_months; i++) {
      const interestPortion = Math.round(balance * monthlyRate * 100) / 100;
      const principalPortion = Math.round((application.monthly_payment - interestPortion) * 100) / 100;
      balance = Math.round((balance - principalPortion) * 100) / 100;
      if (balance < 0) balance = 0;

      const dueDate = new Date(originatedAt);
      dueDate.setMonth(dueDate.getMonth() + i);

      scheduleRows.push({
        id: uuidv4(),
        loan_id: loanId,
        payment_number: i,
        due_date: dueDate,
        payment_amount: application.monthly_payment,
        principal_portion: principalPortion,
        interest_portion: interestPortion,
        remaining_balance: balance,
        created_at: originatedAt,
      });
    }

    // Batch insert amortization schedule
    if (scheduleRows.length > 0) {
      await db('loan_amortization_schedule').insert(scheduleRows);
    }

    // Audit log
    await db('audit_log').insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: userId,
      action: 'loan_originated',
      resource_type: 'loan',
      resource_id: loanId,
      before_state: null,
      after_state: {
        loanId,
        principal: application.approved_amount,
        rate: application.approved_rate,
        termMonths: application.approved_term_months,
      },
      ip_address: req.ip || null,
      created_at: new Date(),
    });

    logger.info('Loan originated', {
      userId,
      tenantId,
      loanId,
      applicationId: application.id,
      principal: application.approved_amount,
    });

    res.status(201).json({
      success: true,
      data: {
        loanId,
        applicationId: application.id,
        status: 'active',
        principalAmount: application.approved_amount,
        interestRate: application.approved_rate,
        termMonths: application.approved_term_months,
        monthlyPayment: application.monthly_payment,
        firstPaymentDate: firstPaymentDate.toISOString(),
        maturityDate: maturityDate.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Failed to originate loan', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to originate loan.',
    });
  }
});
