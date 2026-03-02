import { Router, Request, Response } from 'express';
import db from '../config/database';
import { logger } from '../config/logger';

export const positionsRouter = Router();

// --- GET /positions ---
positionsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;
    const status = (req.query.status as string) || 'open';

    const account = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No trading account found.',
      });
      return;
    }

    const positions = await db('trading_positions')
      .where({ account_id: account.id, tenant_id: tenantId, status })
      .orderBy('opened_at', 'desc');

    const totalValue = positions.reduce((sum: number, p: Record<string, unknown>) => sum + ((p.current_value as number) || 0), 0);
    const totalPnl = positions.reduce((sum: number, p: Record<string, unknown>) => sum + ((p.unrealized_pnl as number) || 0), 0);

    res.json({
      success: true,
      data: {
        positions: positions.map((p: Record<string, unknown>) => ({
          id: p.id,
          ticker: p.ticker,
          side: p.side,
          quantity: p.quantity,
          avgEntryPrice: p.avg_entry_price,
          currentPrice: p.current_price,
          currentValue: p.current_value,
          costBasis: p.cost_basis,
          unrealizedPnl: p.unrealized_pnl,
          unrealizedPnlPct: p.unrealized_pnl_pct,
          realizedPnl: p.realized_pnl,
          dayPnl: p.day_pnl,
          dayPnlPct: p.day_pnl_pct,
          status: p.status,
          openedAt: p.opened_at,
          closedAt: p.closed_at,
        })),
        summary: {
          totalPositions: positions.length,
          totalValue: Math.round(totalValue * 100) / 100,
          totalUnrealizedPnl: Math.round(totalPnl * 100) / 100,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch positions', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch positions.',
    });
  }
});

// --- GET /positions/:id ---
positionsRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const account = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No trading account found.',
      });
      return;
    }

    const position = await db('trading_positions')
      .where({ id: req.params.id, account_id: account.id, tenant_id: tenantId })
      .first();

    if (!position) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Position not found.',
      });
      return;
    }

    // Get related orders for this position
    const orders = await db('trading_orders')
      .where({ account_id: account.id, tenant_id: tenantId, ticker: position.ticker })
      .whereIn('status', ['filled', 'partial_fill'])
      .orderBy('filled_at', 'desc')
      .limit(20);

    res.json({
      success: true,
      data: {
        position: {
          id: position.id,
          ticker: position.ticker,
          side: position.side,
          quantity: position.quantity,
          avgEntryPrice: position.avg_entry_price,
          currentPrice: position.current_price,
          currentValue: position.current_value,
          costBasis: position.cost_basis,
          unrealizedPnl: position.unrealized_pnl,
          unrealizedPnlPct: position.unrealized_pnl_pct,
          realizedPnl: position.realized_pnl,
          dayPnl: position.day_pnl,
          status: position.status,
          openedAt: position.opened_at,
          closedAt: position.closed_at,
        },
        orders: orders.map((o: Record<string, unknown>) => ({
          id: o.id,
          side: o.side,
          quantity: o.filled_quantity,
          price: o.filled_avg_price,
          commission: o.commission,
          filledAt: o.filled_at,
        })),
      },
    });
  } catch (error) {
    logger.error('Failed to fetch position', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch position.',
    });
  }
});

// --- GET /positions/history ---
positionsRouter.get('/history/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const account = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'No trading account found.',
      });
      return;
    }

    const closedPositions = await db('trading_positions')
      .where({ account_id: account.id, tenant_id: tenantId, status: 'closed' })
      .orderBy('closed_at', 'desc')
      .limit(100);

    const totalRealizedPnl = closedPositions.reduce((sum: number, p: Record<string, unknown>) => sum + ((p.realized_pnl as number) || 0), 0);
    const winCount = closedPositions.filter((p: Record<string, unknown>) => ((p.realized_pnl as number) || 0) > 0).length;
    const lossCount = closedPositions.filter((p: Record<string, unknown>) => ((p.realized_pnl as number) || 0) < 0).length;

    res.json({
      success: true,
      data: {
        positions: closedPositions.map((p: Record<string, unknown>) => ({
          id: p.id,
          ticker: p.ticker,
          side: p.side,
          quantity: p.quantity,
          avgEntryPrice: p.avg_entry_price,
          avgExitPrice: p.avg_exit_price,
          realizedPnl: p.realized_pnl,
          realizedPnlPct: p.realized_pnl_pct,
          openedAt: p.opened_at,
          closedAt: p.closed_at,
        })),
        summary: {
          totalTrades: closedPositions.length,
          totalRealizedPnl: Math.round(totalRealizedPnl * 100) / 100,
          winCount,
          lossCount,
          winRate: closedPositions.length > 0
            ? Math.round((winCount / closedPositions.length) * 10000) / 10000
            : 0,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to fetch position history', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch position history.',
    });
  }
});
