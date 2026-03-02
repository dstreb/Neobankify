import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../config/database';
import { logger } from '../config/logger';

export const userRouter = Router();

// --- GET /users/me ---
userRouter.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    if (!userId) {
      res.status(401).json({
        type: 'https://api.neobank.io/errors/unauthorized',
        title: 'Unauthorized',
        status: 401,
        detail: 'User ID not found in request context.',
      });
      return;
    }

    const user = await db('users')
      .where({ id: userId, tenant_id: tenantId })
      .select('id', 'email', 'kyc_status', 'risk_profile', 'goals', 'preferences', 'created_at')
      .first();

    if (!user) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'User Not Found',
        status: 404,
        detail: 'User not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        kycStatus: user.kyc_status,
        riskProfile: user.risk_profile,
        goals: user.goals,
        preferences: user.preferences,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch user', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch user profile.',
    });
  }
});

// --- PATCH /users/me ---
const updateProfileSchema = z.object({
  riskProfile: z.enum(['conservative', 'moderate', 'aggressive']).optional(),
  preferences: z.object({
    notificationFrequency: z.enum(['realtime', 'daily', 'weekly']).optional(),
    autoSweepEnabled: z.boolean().optional(),
    recommendationStyle: z.enum(['proactive', 'on_demand']).optional(),
    preferredRedemptionType: z.enum(['cashback', 'travel', 'transfer', 'gift_cards']).optional(),
  }).optional(),
}).strict();

userRouter.patch('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const updates: Record<string, unknown> = { updated_at: new Date() };

    if (parsed.data.riskProfile) {
      updates.risk_profile = parsed.data.riskProfile;
    }
    if (parsed.data.preferences) {
      // Merge with existing preferences (JSONB column — pg driver returns parsed objects)
      const existing = await db('users').where({ id: userId, tenant_id: tenantId }).select('preferences').first();
      const existingPrefs = typeof existing?.preferences === 'string'
        ? JSON.parse(existing.preferences)
        : existing?.preferences || {};
      updates.preferences = {
        ...existingPrefs,
        ...parsed.data.preferences,
      };
    }

    await db('users')
      .where({ id: userId, tenant_id: tenantId })
      .update(updates);

    res.json({ success: true, data: { message: 'Profile updated.' } });
  } catch (error) {
    logger.error('Failed to update user', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to update user profile.',
    });
  }
});

// --- GET /users/me/goals ---
userRouter.get('/me/goals', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const goals = await db('user_goals')
      .where({ user_id: userId, status: 'active' })
      .orderBy('priority', 'asc');

    res.json({
      success: true,
      data: goals.map(g => ({
        id: g.id,
        type: g.goal_type,
        parameters: g.parameters,
        priority: g.priority,
        status: g.status,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch goals', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch user goals.',
    });
  }
});

// --- POST /users/me/goals ---
const createGoalSchema = z.object({
  type: z.enum(['maximize_cashback', 'travel_rewards', 'points_maximizer', 'minimize_fees', 'grow_savings']),
  parameters: z.record(z.unknown()).default({}),
  priority: z.number().int().min(1).max(10).default(1),
});

userRouter.post('/me/goals', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const parsed = createGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const goalId = require('uuid').v4();

    await db('user_goals').insert({
      id: goalId,
      user_id: userId,
      goal_type: parsed.data.type,
      parameters: parsed.data.parameters,
      priority: parsed.data.priority,
      status: 'active',
      created_at: new Date(),
    });

    res.status(201).json({
      success: true,
      data: { id: goalId, type: parsed.data.type, priority: parsed.data.priority },
    });
  } catch (error) {
    logger.error('Failed to create goal', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to create user goal.',
    });
  }
});
