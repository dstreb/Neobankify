import { Router, Request, Response } from 'express';
import db from '../config/database';
import { logger } from '../config/logger';

export const complianceRouter = Router();

/**
 * Fair Lending Compliance Endpoints
 *
 * Implements ECOA (Equal Credit Opportunity Act) and FCRA (Fair Credit Reporting Act)
 * requirements for lending decisions.
 */

// --- GET /compliance/adverse-action/:applicationId ---
complianceRouter.get('/adverse-action/:applicationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const application = await db('loan_applications')
      .where({ id: req.params.applicationId, user_id: userId, tenant_id: tenantId, status: 'denied' })
      .first();

    if (!application) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Denied loan application not found.',
      });
      return;
    }

    const adverseReasons = application.adverse_action_reasons || [];
    const underwritingDecision = (application.underwriting_decision || {}) as Record<string, unknown>;
    const factors = (underwritingDecision.factors || []) as Array<{ name: string; score: number; detail: string }>;

    // ECOA-compliant adverse action notice
    res.json({
      success: true,
      data: {
        notice: {
          type: 'ADVERSE_ACTION_NOTICE',
          applicantId: userId,
          applicationId: application.id,
          applicationDate: application.submitted_at,
          decisionDate: application.decision_at,
          requestedAmount: application.requested_amount,

          // Decision details
          decision: 'DENIED',
          decisionScore: underwritingDecision.decisionScore ?? null,

          // ECOA-required adverse action reasons (top 4)
          reasons: adverseReasons.slice(0, 4).map((r: { code: string; description: string }) => ({
            code: r.code,
            description: r.description,
          })),

          // Credit score disclosure (FCRA Section 609(g))
          creditScoreDisclosure: {
            score: application.credit_score_at_application,
            scoreRange: { min: 300, max: 850 },
            scoreName: 'FICO Score 8',
            keyFactors: factors.filter((f: { score: number }) => f.score < 60).slice(0, 4).map((f: { name: string; detail: string }) => f.detail),
            bureauUsed: 'TransUnion',
            bureauContact: {
              name: 'TransUnion LLC',
              address: 'P.O. Box 1000, Chester, PA 19016',
              phone: '1-800-916-8800',
              website: 'www.transunion.com',
            },
          },

          // Applicant rights
          rights: {
            freeReportRight: 'You have the right to obtain a free copy of your credit report from the consumer reporting agency named above within 60 days of receiving this notice.',
            disputeRight: 'You have the right to dispute the accuracy or completeness of any information in your credit report.',
            ecoaNotice: 'The Federal Equal Credit Opportunity Act prohibits creditors from discriminating against credit applicants on the basis of race, color, religion, national origin, sex, marital status, age, because all or part of the applicant\'s income derives from any public assistance program, or because the applicant has in good faith exercised any right under the Consumer Credit Protection Act.',
            cfpbContact: {
              name: 'Consumer Financial Protection Bureau',
              website: 'www.consumerfinance.gov',
              phone: '1-855-411-2372',
            },
          },

          // Institution info
          creditor: {
            name: 'Neobankify (White-label Platform)',
            address: 'On file',
          },
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch adverse action notice', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch adverse action notice.',
    });
  }
});

// --- GET /compliance/fair-lending-report ---
// Admin/compliance endpoint for fair lending analysis
complianceRouter.get('/fair-lending-report', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const startDate = req.query.startDate as string || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = req.query.endDate as string || new Date().toISOString();

    // Aggregate lending decisions for fair lending monitoring
    const totalApplications = await db('loan_applications')
      .where({ tenant_id: tenantId })
      .whereBetween('submitted_at', [startDate, endDate])
      .count('id as count')
      .first();

    const approvedCount = await db('loan_applications')
      .where({ tenant_id: tenantId, status: 'approved' })
      .orWhere({ tenant_id: tenantId, status: 'originated' })
      .whereBetween('submitted_at', [startDate, endDate])
      .count('id as count')
      .first();

    const deniedCount = await db('loan_applications')
      .where({ tenant_id: tenantId, status: 'denied' })
      .whereBetween('submitted_at', [startDate, endDate])
      .count('id as count')
      .first();

    // Denial reason distribution
    const deniedApps = await db('loan_applications')
      .where({ tenant_id: tenantId, status: 'denied' })
      .whereBetween('submitted_at', [startDate, endDate])
      .select('adverse_action_reasons');

    const reasonCounts: Record<string, number> = {};
    for (const app of deniedApps) {
      const reasons = app.adverse_action_reasons || [];
      for (const reason of reasons) {
        const code = (reason as { code: string }).code;
        reasonCounts[code] = (reasonCounts[code] || 0) + 1;
      }
    }

    // Average decision score by outcome
    const avgScores = await db('loan_applications')
      .where({ tenant_id: tenantId })
      .whereBetween('submitted_at', [startDate, endDate])
      .whereNotNull('decision_score')
      .select('status')
      .avg('decision_score as avg_score')
      .groupBy('status');

    // Rate distribution for approved loans
    const rateDistribution = await db('loan_applications')
      .where({ tenant_id: tenantId })
      .whereIn('status', ['approved', 'originated'])
      .whereBetween('submitted_at', [startDate, endDate])
      .whereNotNull('approved_apr')
      .select('risk_tier_at_application as risk_grade')
      .avg('approved_apr as avg_rate')
      .count('id as count')
      .groupBy('risk_tier_at_application')
      .orderBy('risk_tier_at_application');

    const total = Number(totalApplications?.count || 0);
    const approved = Number(approvedCount?.count || 0);
    const denied = Number(deniedCount?.count || 0);

    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        summary: {
          totalApplications: total,
          approved,
          denied,
          pending: total - approved - denied,
          approvalRate: total > 0 ? Math.round((approved / total) * 10000) / 10000 : 0,
          denialRate: total > 0 ? Math.round((denied / total) * 10000) / 10000 : 0,
        },
        denialReasons: Object.entries(reasonCounts)
          .map(([code, count]) => ({ code, count, pct: denied > 0 ? Math.round((count / denied) * 10000) / 10000 : 0 }))
          .sort((a, b) => b.count - a.count),
        avgDecisionScores: avgScores.map((s: Record<string, unknown>) => ({
          status: s.status,
          avgScore: Math.round(Number(s.avg_score) * 100) / 100,
        })),
        rateDistribution: rateDistribution.map((r: Record<string, unknown>) => ({
          riskGrade: r.risk_grade,
          avgRate: Math.round(Number(r.avg_rate) * 10000) / 10000,
          count: Number(r.count),
        })),
        complianceNotes: [
          'This report is generated for fair lending monitoring purposes.',
          'Ensure approval/denial rates are consistent across demographic groups.',
          'Review denial reason distribution for potential disparate impact.',
          'All automated decisions include explainability and audit trails.',
        ],
      },
    });
  } catch (error) {
    logger.error('Failed to generate fair lending report', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to generate fair lending report.',
    });
  }
});

// --- GET /compliance/decision-audit/:applicationId ---
complianceRouter.get('/decision-audit/:applicationId', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const application = await db('loan_applications')
      .where({ id: req.params.applicationId, tenant_id: tenantId })
      .first();

    if (!application) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Loan application not found.',
      });
      return;
    }

    // Get all audit log entries for this application
    const auditEntries = await db('audit_log')
      .where({ entity_id: application.id, tenant_id: tenantId })
      .orderBy('created_at', 'asc');

    // Get agent decision
    const agentDecision = await db('agent_decisions')
      .where({ user_id: application.user_id, tenant_id: tenantId, agent_type: 'credit_underwriting' })
      .orderBy('created_at', 'desc')
      .first();

    res.json({
      success: true,
      data: {
        applicationId: application.id,
        status: application.status,
        submittedAt: application.submitted_at,
        decisionAt: application.decision_at,
        underwritingDecision: application.underwriting_decision,
        decisionScore: ((application.underwriting_decision || {}) as Record<string, unknown>).decisionScore ?? null,
        riskGrade: application.risk_tier_at_application,
        adverseActionReasons: application.adverse_action_reasons,
        explanation: ((application.underwriting_decision || {}) as Record<string, unknown>).explanation ?? null,
        auditTrail: auditEntries.map((e: Record<string, unknown>) => ({
          action: e.action,
          beforeState: e.before_state,
          afterState: e.after_state,
          timestamp: e.created_at,
        })),
        agentDecision: agentDecision ? {
          agentType: agentDecision.agent_type,
          decisionType: agentDecision.decision_type,
          decision: agentDecision.decision,
          reasoning: agentDecision.reasoning,
          confidenceScore: agentDecision.confidence_score,
          inputFeatures: agentDecision.input_features,
          outcome: agentDecision.outcome,
          createdAt: agentDecision.created_at,
        } : null,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch decision audit', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch decision audit.',
    });
  }
});
