import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';
import { assessSuitability, SuitabilityInput } from '../lib/suitability-engine';

export const suitabilityRouter = Router();

const suitabilitySchema = z.object({
  riskTolerance: z.enum(['conservative', 'moderate_conservative', 'moderate', 'moderate_aggressive', 'aggressive']),
  investmentHorizon: z.enum(['short_term', 'medium_term', 'long_term', 'retirement']),
  annualIncomeRange: z.enum(['under_25k', '25k_50k', '50k_100k', '100k_250k', '250k_500k', 'over_500k']),
  netWorthRange: z.enum(['under_25k', '25k_100k', '100k_500k', '500k_1m', '1m_5m', 'over_5m']),
  investmentExperience: z.enum(['none', 'limited', 'moderate', 'extensive']),
  investmentObjective: z.enum(['capital_preservation', 'income', 'growth_income', 'growth', 'aggressive_growth']),
  liquidityNeeds: z.enum(['low', 'moderate', 'high']),
  isAccreditedInvestor: z.boolean().default(false),
});

// --- POST /suitability/assess ---
suitabilityRouter.post('/assess', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = suitabilitySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    const input: SuitabilityInput = parsed.data;
    const result = assessSuitability(input);

    // Store the suitability assessment
    const assessmentId = uuidv4();
    await db('investment_profiles').insert({
      id: assessmentId,
      tenant_id: tenantId,
      user_id: userId,
      risk_tolerance: input.riskTolerance,
      investment_horizon: input.investmentHorizon,
      annual_income_range: input.annualIncomeRange,
      net_worth_range: input.netWorthRange,
      investment_experience: input.investmentExperience,
      investment_objective: input.investmentObjective,
      liquidity_needs: input.liquidityNeeds,
      is_accredited_investor: input.isAccreditedInvestor,
      risk_score: result.riskScore,
      risk_level: result.riskLevel,
      recommended_strategy: result.recommendedStrategy,
      recommended_allocation: result.recommendedAllocation,
      suitability_explanation: result.explanation,
      suitability_warnings: result.warnings,
      status: 'active',
      assessed_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Audit log the assessment
    await db('audit_log').insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: userId,
      action: 'suitability_assessment',
      resource_type: 'investment_profile',
      resource_id: assessmentId,
      before_state: null,
      after_state: {
        riskScore: result.riskScore,
        riskLevel: result.riskLevel,
        strategy: result.recommendedStrategy,
        warnings: result.warnings,
      },
      ip_address: req.ip || null,
      created_at: new Date(),
    });

    logger.info('Suitability assessment completed', {
      userId,
      tenantId,
      assessmentId,
      riskScore: result.riskScore,
      riskLevel: result.riskLevel,
    });

    res.status(201).json({
      success: true,
      data: {
        assessmentId,
        ...result,
      },
    });
  } catch (error) {
    logger.error('Suitability assessment failed', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to complete suitability assessment.',
    });
  }
});

// --- GET /suitability/profile ---
suitabilityRouter.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const profile = await db('investment_profiles')
      .where({ user_id: userId, tenant_id: tenantId, status: 'active' })
      .orderBy('assessed_at', 'desc')
      .first();

    if (!profile) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No suitability assessment found. Please complete an assessment first.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: profile.id,
        riskScore: profile.risk_score,
        riskLevel: profile.risk_level,
        riskTolerance: profile.risk_tolerance,
        investmentHorizon: profile.investment_horizon,
        investmentObjective: profile.investment_objective,
        investmentExperience: profile.investment_experience,
        recommendedStrategy: profile.recommended_strategy,
        recommendedAllocation: profile.recommended_allocation,
        explanation: profile.suitability_explanation,
        warnings: profile.suitability_warnings,
        assessedAt: profile.assessed_at,
        isAccreditedInvestor: profile.is_accredited_investor,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch suitability profile', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch suitability profile.',
    });
  }
});

// --- GET /suitability/history ---
suitabilityRouter.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const assessments = await db('investment_profiles')
      .where({ user_id: userId, tenant_id: tenantId })
      .orderBy('assessed_at', 'desc')
      .select(
        'id',
        'risk_score',
        'risk_level',
        'recommended_strategy',
        'suitability_warnings',
        'status',
        'assessed_at',
      );

    res.json({
      success: true,
      data: assessments.map((a: Record<string, unknown>) => ({
        id: a.id,
        riskScore: a.risk_score,
        riskLevel: a.risk_level,
        recommendedStrategy: a.recommended_strategy,
        warnings: a.suitability_warnings,
        status: a.status,
        assessedAt: a.assessed_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch suitability history', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch suitability history.',
    });
  }
});
