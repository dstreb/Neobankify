import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';

export const paperTradingRouter = Router();

/**
 * Paper trading allows users to practice with simulated money.
 * All paper trades are tracked separately and clearly marked.
 */

// --- POST /paper-trading/accounts ---
paperTradingRouter.post('/accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      initialBalance: z.number().min(1000).max(1000000).default(100000),
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

    // Check for existing paper account
    const existing = await db('paper_trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId })
      .whereNot({ status: 'closed' })
      .first();

    if (existing) {
      res.status(409).json({
        type: 'https://api.neobank.io/errors/conflict',
        title: 'Account Exists',
        status: 409,
        detail: 'You already have an active paper trading account.',
      });
      return;
    }

    const accountId = uuidv4();
    const initialBalance = parsed.data.initialBalance;

    await db('paper_trading_accounts').insert({
      id: accountId,
      tenant_id: tenantId,
      user_id: userId,
      status: 'active',
      initial_balance: initialBalance,
      cash_balance: initialBalance,
      portfolio_value: initialBalance,
      peak_value: initialBalance,
      total_pnl: 0,
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info('Paper trading account created', { userId, tenantId, accountId, initialBalance });

    res.status(201).json({
      success: true,
      data: {
        id: accountId,
        status: 'active',
        initialBalance,
        cashBalance: initialBalance,
        portfolioValue: initialBalance,
      },
    });
  } catch (error) {
    logger.error('Failed to create paper account', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to create paper trading account.',
    });
  }
});

// --- GET /paper-trading/accounts ---
paperTradingRouter.get('/accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const account = await db('paper_trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId })
      .whereNot({ status: 'closed' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No paper trading account found.',
      });
      return;
    }

    const winRate = account.total_trades > 0
      ? Math.round((account.winning_trades / account.total_trades) * 10000) / 10000
      : 0;
    const returnPct = account.initial_balance > 0
      ? Math.round(((account.portfolio_value - account.initial_balance) / account.initial_balance) * 10000) / 10000
      : 0;

    res.json({
      success: true,
      data: {
        id: account.id,
        status: account.status,
        initialBalance: account.initial_balance,
        cashBalance: account.cash_balance,
        portfolioValue: account.portfolio_value,
        peakValue: account.peak_value,
        totalPnl: account.total_pnl,
        totalTrades: account.total_trades,
        winningTrades: account.winning_trades,
        losingTrades: account.losing_trades,
        winRate,
        returnPct,
        createdAt: account.created_at,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch paper account', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch paper trading account.',
    });
  }
});

// --- POST /paper-trading/accounts/reset ---
paperTradingRouter.post('/accounts/reset', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const account = await db('paper_trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No active paper trading account found.',
      });
      return;
    }

    // Reset account to initial state
    await db('paper_trading_accounts')
      .where({ id: account.id })
      .update({
        cash_balance: account.initial_balance,
        portfolio_value: account.initial_balance,
        peak_value: account.initial_balance,
        total_pnl: 0,
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        updated_at: new Date(),
      });

    // Close all paper positions for this user
    // trading_positions.account_id references trading_accounts(id), not paper_trading_accounts(id)
    // So query by user_id + tenant_id and join through trading_accounts where is_paper=true
    const paperTradingAccount = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId, is_paper: true })
      .first();

    if (paperTradingAccount) {
      await db('trading_positions')
        .where({ account_id: paperTradingAccount.id, tenant_id: tenantId, status: 'open' })
        .update({ status: 'closed', closed_at: new Date() });

      // Cancel all pending paper orders
      await db('trading_orders')
        .where({ account_id: paperTradingAccount.id, tenant_id: tenantId, is_paper_trade: true })
        .whereIn('status', ['pending', 'submitted'])
        .update({ status: 'cancelled', updated_at: new Date() });
    }

    logger.info('Paper account reset', { userId, tenantId, accountId: account.id });

    res.json({
      success: true,
      data: {
        message: 'Paper trading account reset to initial balance.',
        initialBalance: account.initial_balance,
      },
    });
  } catch (error) {
    logger.error('Failed to reset paper account', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to reset paper trading account.',
    });
  }
});

// --- GET /paper-trading/leaderboard ---
paperTradingRouter.get('/leaderboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const accounts = await db('paper_trading_accounts')
      .where({ tenant_id: tenantId, status: 'active' })
      .where('total_trades', '>', 0)
      .orderByRaw('(portfolio_value - initial_balance) / initial_balance DESC')
      .limit(25);

    res.json({
      success: true,
      data: accounts.map((a: Record<string, unknown>, index: number) => {
        const initialBalance = a.initial_balance as number;
        const portfolioValue = a.portfolio_value as number;
        const totalTrades = a.total_trades as number;
        const winningTrades = a.winning_trades as number;
        return {
          rank: index + 1,
          userId: a.user_id,
          portfolioValue,
          returnPct: initialBalance > 0
            ? Math.round(((portfolioValue - initialBalance) / initialBalance) * 10000) / 10000
            : 0,
          totalTrades,
          winRate: totalTrades > 0
            ? Math.round((winningTrades / totalTrades) * 10000) / 10000
            : 0,
        };
      }),
    });
  } catch (error) {
    logger.error('Failed to fetch leaderboard', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch paper trading leaderboard.',
    });
  }
});
