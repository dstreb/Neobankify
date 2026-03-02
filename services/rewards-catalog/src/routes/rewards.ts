import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../config/database';
import { logger } from '../config/logger';
import { trackTransactionReward } from '../lib/reward-tracker';

export const rewardsRouter = Router();

// --- GET /rewards/summary ---
rewardsRouter.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    // Aggregate reward earnings
    const earned = await db('agent_decisions')
      .where({ user_id: userId, tenant_id: tenantId, agent_type: 'rewards_optimization' })
      .whereRaw("decision->>'pointsEarned' IS NOT NULL")
      .sum({ totalPoints: db.raw("(decision->>'pointsEarned')::numeric") })
      .sum({ totalCashback: db.raw("(decision->>'cashbackEarned')::numeric") })
      .first();

    // Get missed value
    const missed = await db('transactions')
      .where({ user_id: userId, tenant_id: tenantId })
      .whereRaw("enrichment_data->>'missedValue' IS NOT NULL")
      .sum({ missedValue: db.raw("(enrichment_data->>'missedValue')::numeric") })
      .first();

    res.json({
      success: true,
      data: {
        totalPointsEarned: earned?.totalPoints || 0,
        totalCashbackEarned: parseFloat(String(earned?.totalCashback || 0)).toFixed(2),
        totalMissedValue: parseFloat(String(missed?.missedValue || 0)).toFixed(2),
        period: 'all_time',
      },
    });
  } catch (error) {
    logger.error('Failed to fetch rewards summary', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch rewards summary.',
    });
  }
});

// --- GET /rewards/programs ---
rewardsRouter.get('/programs', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const programs = await db('reward_programs')
      .where({ tenant_id: tenantId })
      .orderBy('name');

    res.json({
      success: true,
      data: programs.map(p => ({
        id: p.id,
        name: p.name,
        issuer: p.issuer,
        programType: p.program_type,
        baseEarnRate: p.base_earn_rate,
        categoryRates: p.category_rates,
        pointValueCents: p.point_value_cents,
        annualFee: p.annual_fee,
        signupBonus: p.signup_bonus,
        isActive: p.is_active,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch reward programs', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch reward programs.',
    });
  }
});

// --- GET /rewards/offers ---
rewardsRouter.get('/offers', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    // Get user's cards and their associated reward programs
    const cards = await db('user_cards')
      .where({ 'user_cards.user_id': userId, 'user_cards.status': 'active' })
      .join('reward_programs', function() {
        this.on('user_cards.reward_program_id', 'reward_programs.id')
            .andOn('reward_programs.tenant_id', '=', db.raw('?', [tenantId]));
      })
      .select(
        'user_cards.card_name',
        'reward_programs.name as program_name',
        'reward_programs.category_rates',
        'reward_programs.signup_bonus',
      );

    // Return cards with their reward program details as "offers"
    const offers = cards
      .filter(c => c.signup_bonus)
      .map(c => ({
        cardName: c.card_name,
        programName: c.program_name,
        signupBonus: c.signup_bonus,
        categoryRates: c.category_rates,
      }));

    res.json({ success: true, data: offers });
  } catch (error) {
    logger.error('Failed to fetch offers', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch offers.',
    });
  }
});

// --- GET /rewards/history ---
rewardsRouter.get('/history', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);
    const cursor = req.query.cursor as string;

    let query = db('agent_decisions')
      .where({ user_id: userId, tenant_id: tenantId, agent_type: 'rewards_optimization' })
      .orderBy('created_at', 'desc')
      .limit(limit + 1);

    if (cursor) {
      query = query.where('created_at', '<', cursor);
    }

    const decisions = await query;
    const hasMore = decisions.length > limit;
    if (hasMore) decisions.pop();

    res.json({
      success: true,
      data: decisions.map(d => ({
        id: d.id,
        decisionType: d.decision_type,
        decision: d.decision,
        reasoning: d.reasoning,
        confidenceScore: d.confidence_score,
        outcome: d.outcome,
        createdAt: d.created_at,
      })),
      meta: {
        cursor: decisions.length > 0 ? decisions[decisions.length - 1].created_at : null,
        hasMore,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch rewards history', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch rewards history.',
    });
  }
});

// --- POST /rewards/track ---
// Track reward earnings for a specific enriched transaction
const trackSchema = z.object({
  transactionId: z.string().uuid(),
  amount: z.number().positive(),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  merchantNormalized: z.string().min(1),
  merchantCanonical: z.string().nullable().optional(),
  cardUsed: z.string().uuid().nullable().optional(),
  redemptionPreference: z.enum(['cashback', 'travel', 'transfer', 'gift_cards']).optional(),
});

rewardsRouter.post('/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = trackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const result = await trackTransactionReward({
      transactionId: parsed.data.transactionId,
      userId,
      tenantId,
      amount: parsed.data.amount,
      category: parsed.data.category,
      subcategory: parsed.data.subcategory,
      merchantNormalized: parsed.data.merchantNormalized,
      merchantCanonical: parsed.data.merchantCanonical ?? null,
      cardUsed: parsed.data.cardUsed ?? null,
      redemptionPreference: parsed.data.redemptionPreference,
    });

    if (!result) {
      res.json({
        success: true,
        data: { tracked: false, reason: 'No cards in portfolio' },
      });
      return;
    }

    res.json({
      success: true,
      data: {
        tracked: true,
        rewardEarnedId: result.rewardEarnedId,
        pointsEarned: result.pointsEarned,
        cashbackEarned: result.cashbackEarned,
        wasOptimal: result.wasOptimal,
        missedValue: result.missedValue,
        hasRecommendation: result.agentDecisionId !== null,
      },
    });
  } catch (error) {
    logger.error('Failed to track reward', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to track reward.',
    });
  }
});
