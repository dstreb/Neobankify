import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';

export const recommendationsRouter = Router();

// --- GET /recommendations ---
recommendationsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const recommendations = await db('agent_decisions')
      .where({ user_id: userId, outcome: 'recommended' })
      .orderBy('created_at', 'desc')
      .limit(20);

    res.json({
      success: true,
      data: recommendations.map(r => ({
        id: r.id,
        agentType: r.agent_type,
        decisionType: r.decision_type,
        decision: r.decision,
        reasoning: r.reasoning,
        confidenceScore: r.confidence_score,
        guardrailsTriggered: r.guardrails_triggered,
        createdAt: r.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch recommendations', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch recommendations.',
    });
  }
});

// --- GET /recommendations/:id ---
recommendationsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const rec = await db('agent_decisions')
      .where({ id: req.params.id, user_id: userId })
      .first();

    if (!rec) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Recommendation Not Found',
        status: 404,
        detail: 'Recommendation not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: rec.id,
        agentType: rec.agent_type,
        decisionType: rec.decision_type,
        decision: rec.decision,
        reasoning: rec.reasoning,
        confidenceScore: rec.confidence_score,
        inputFeatures: rec.input_features,
        guardrailsTriggered: rec.guardrails_triggered,
        outcome: rec.outcome,
        createdAt: rec.created_at,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch recommendation', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch recommendation.',
    });
  }
});

// --- POST /recommendations/:id/accept ---
recommendationsRouter.post('/:id/accept', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const updated = await db('agent_decisions')
      .where({ id: req.params.id, user_id: userId, outcome: 'recommended' })
      .update({ outcome: 'executed' });

    if (!updated) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Recommendation Not Found',
        status: 404,
        detail: 'Active recommendation not found.',
      });
      return;
    }

    logger.info('Recommendation accepted', { recommendationId: req.params.id, userId });
    res.json({ success: true, data: { message: 'Recommendation accepted.' } });
  } catch (error) {
    logger.error('Failed to accept recommendation', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to accept recommendation.',
    });
  }
});

// --- POST /recommendations/:id/dismiss ---
recommendationsRouter.post('/:id/dismiss', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    await db('agent_decisions')
      .where({ id: req.params.id, user_id: userId, outcome: 'recommended' })
      .update({ outcome: 'dismissed' });

    res.json({ success: true, data: { message: 'Recommendation dismissed.' } });
  } catch (error) {
    logger.error('Failed to dismiss recommendation', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to dismiss recommendation.',
    });
  }
});

// --- POST /recommendations/:id/override ---
recommendationsRouter.post('/:id/override', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { reason } = req.body;

    await db('agent_decisions')
      .where({ id: req.params.id, user_id: userId })
      .update({
        outcome: 'overridden',
        reasoning: db.raw("reasoning || ' | USER OVERRIDE: ' || ?", [reason || 'No reason provided']),
      });

    logger.info('Recommendation overridden', { recommendationId: req.params.id, userId, reason });
    res.json({ success: true, data: { message: 'Recommendation overridden.' } });
  } catch (error) {
    logger.error('Failed to override recommendation', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to override recommendation.',
    });
  }
});
