import { Router, Request, Response } from 'express';
import db from '../config/database';
import { logger } from '../config/logger';

export const idleCashRouter = Router();

// --- GET /idle-cash/positions ---
idleCashRouter.get('/positions', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const positions = await db('idle_cash_positions')
      .where({ user_id: userId, status: 'active' })
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: positions.map(p => ({
        id: p.id,
        vehicleType: p.vehicle_type,
        provider: p.provider,
        amount: p.amount,
        apy: p.apy,
        fdicInsured: p.fdic_insured,
        maturityDate: p.maturity_date,
        status: p.status,
        createdAt: p.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch idle cash positions', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch idle cash positions.',
    });
  }
});

// --- GET /idle-cash/summary ---
idleCashRouter.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const positions = await db('idle_cash_positions')
      .where({ user_id: userId, status: 'active' });

    const totalDeployed = positions.reduce((sum, p) => sum + parseFloat(p.amount), 0);
    const weightedApy = positions.length > 0
      ? positions.reduce((sum, p) => sum + parseFloat(p.amount) * parseFloat(p.apy), 0) / totalDeployed
      : 0;
    const projectedAnnualYield = totalDeployed * weightedApy;

    res.json({
      success: true,
      data: {
        totalDeployed: Math.round(totalDeployed * 100) / 100,
        weightedAverageApy: Math.round(weightedApy * 10000) / 10000,
        projectedAnnualYield: Math.round(projectedAnnualYield * 100) / 100,
        positionCount: positions.length,
        fdicCoveredAmount: positions
          .filter(p => p.fdic_insured)
          .reduce((sum, p) => sum + parseFloat(p.amount), 0),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch idle cash summary', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch idle cash summary.',
    });
  }
});

// --- GET /idle-cash/rates ---
idleCashRouter.get('/rates', async (_req: Request, res: Response): Promise<void> => {
  try {
    // In production, these rates would come from partner APIs and be cached
    const rates = [
      { vehicleType: 'hysa', provider: 'Treasury Prime', apy: 0.0450, fdicInsured: true, minimumDeposit: 0 },
      { vehicleType: 'money_market', provider: 'Apex', apy: 0.0475, fdicInsured: true, minimumDeposit: 1000 },
      { vehicleType: 'treasury_bill', provider: 'Treasury Direct', apy: 0.0520, fdicInsured: false, minimumDeposit: 100 },
      { vehicleType: 'cd_3mo', provider: 'Treasury Prime', apy: 0.0490, fdicInsured: true, minimumDeposit: 500 },
      { vehicleType: 'cd_6mo', provider: 'Treasury Prime', apy: 0.0510, fdicInsured: true, minimumDeposit: 500 },
      { vehicleType: 'cd_12mo', provider: 'Treasury Prime', apy: 0.0530, fdicInsured: true, minimumDeposit: 1000 },
    ];

    res.json({ success: true, data: rates });
  } catch (error) {
    logger.error('Failed to fetch rates', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch yield rates.',
    });
  }
});
