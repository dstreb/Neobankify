import { Router, Request, Response } from 'express';
import db from '../config/database';
import { logger } from '../config/logger';
import { assessRisk, calculatePositionSize, checkDrawdownLimit } from '../lib/risk-manager';
import { z } from 'zod';

export const riskRouter = Router();

// --- GET /risk/assessment ---
riskRouter.get('/assessment', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const account = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No active trading account found.',
      });
      return;
    }

    const positions = await db('trading_positions')
      .where({ account_id: account.id, tenant_id: tenantId, status: 'open' });

    const positionData = positions.map((p: Record<string, unknown>) => ({
      ticker: p.ticker as string,
      currentValue: (p.current_value as number) || 0,
    }));

    // Estimate daily portfolio volatility (simplified)
    const totalValue = positionData.reduce((sum: number, p: { ticker: string; currentValue: number }) => sum + p.currentValue, 0);
    const dailyVolatility = 0.015; // 1.5% default; in production calculated from returns

    const metrics = assessRisk(
      account.portfolio_value || totalValue,
      account.peak_value || account.portfolio_value || totalValue,
      dailyVolatility,
      positionData,
      account.risk_level || 'moderate',
    );

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to assess risk', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to assess portfolio risk.',
    });
  }
});

// --- POST /risk/position-size ---
riskRouter.post('/position-size', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      ticker: z.string().min(1).max(10),
      currentPrice: z.number().positive(),
      expectedReturn: z.number(),
      volatility: z.number().positive(),
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

    const account = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No active trading account found.',
      });
      return;
    }

    const result = calculatePositionSize(
      account.portfolio_value || account.cash_balance,
      parsed.data.currentPrice,
      parsed.data.expectedReturn,
      parsed.data.volatility,
      account.risk_level || 'moderate',
    );

    res.json({
      success: true,
      data: {
        ticker: parsed.data.ticker,
        ...result,
      },
    });
  } catch (error) {
    logger.error('Failed to calculate position size', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to calculate position size.',
    });
  }
});

// --- GET /risk/drawdown ---
riskRouter.get('/drawdown', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const account = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No active trading account found.',
      });
      return;
    }

    const drawdown = checkDrawdownLimit(
      account.portfolio_value,
      account.peak_value,
      account.risk_level || 'moderate',
    );

    res.json({
      success: true,
      data: {
        ...drawdown,
        portfolioValue: account.portfolio_value,
        peakValue: account.peak_value,
        riskLevel: account.risk_level,
      },
    });
  } catch (error) {
    logger.error('Failed to check drawdown', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to check drawdown.',
    });
  }
});
