import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';
import { checkDrawdownLimit } from '../lib/risk-manager';

export const tradingRouter = Router();

const orderSchema = z.object({
  ticker: z.string().min(1).max(10),
  side: z.enum(['buy', 'sell', 'short', 'cover']),
  orderType: z.enum(['market', 'limit', 'stop', 'stop_limit', 'trailing_stop']),
  quantity: z.number().positive(),
  limitPrice: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  trailingPct: z.number().min(0.01).max(0.50).optional(),
  timeInForce: z.enum(['day', 'gtc', 'ioc', 'fok']).default('day'),
  isPaperTrade: z.boolean().default(false),
}).refine(
  data => data.orderType !== 'limit' || data.limitPrice !== undefined,
  { message: 'limitPrice required for limit orders' },
).refine(
  data => !['stop', 'stop_limit'].includes(data.orderType) || data.stopPrice !== undefined,
  { message: 'stopPrice required for stop orders' },
).refine(
  data => data.orderType !== 'trailing_stop' || data.trailingPct !== undefined,
  { message: 'trailingPct required for trailing stop orders' },
);

// --- POST /trading/orders ---
tradingRouter.post('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '),
      });
      return;
    }

    // Get trading account
    const account = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!account) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/precondition',
        title: 'No Trading Account',
        status: 400,
        detail: 'No active trading account found. Please open one first.',
      });
      return;
    }

    // Check drawdown limit before allowing new orders
    const drawdownCheck = checkDrawdownLimit(
      account.portfolio_value,
      account.peak_value,
      account.risk_level || 'moderate',
    );

    if (drawdownCheck.isBreached) {
      res.status(403).json({
        type: 'https://api.neobank.io/errors/risk-limit',
        title: 'Drawdown Limit Breached',
        status: 403,
        detail: `Trading halted: drawdown at ${(drawdownCheck.currentDrawdown * 100).toFixed(1)}% exceeds ${(drawdownCheck.maxAllowedDrawdown * 100).toFixed(0)}% limit.`,
      });
      return;
    }

    // For sell/cover orders, verify position exists
    if (['sell', 'cover'].includes(parsed.data.side)) {
      const position = await db('trading_positions')
        .where({
          account_id: account.id,
          tenant_id: tenantId,
          ticker: parsed.data.ticker,
          status: 'open',
        })
        .first();

      if (!position || position.quantity < parsed.data.quantity) {
        res.status(400).json({
          type: 'https://api.neobank.io/errors/insufficient-position',
          title: 'Insufficient Position',
          status: 400,
          detail: `Not enough shares of ${parsed.data.ticker} to ${parsed.data.side}.`,
        });
        return;
      }
    }

    const orderId = uuidv4();
    await db('trading_orders').insert({
      id: orderId,
      account_id: account.id,
      tenant_id: tenantId,
      user_id: userId,
      ticker: parsed.data.ticker,
      side: parsed.data.side,
      order_type: parsed.data.orderType,
      quantity: parsed.data.quantity,
      limit_price: parsed.data.limitPrice || null,
      stop_price: parsed.data.stopPrice || null,
      trailing_pct: parsed.data.trailingPct || null,
      time_in_force: parsed.data.timeInForce,
      is_paper_trade: parsed.data.isPaperTrade,
      status: 'pending',
      filled_quantity: 0,
      filled_avg_price: null,
      commission: 0,
      external_order_id: null,
      submitted_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Audit log
    await db('audit_log').insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: userId,
      event_type: 'audit.immutable',
      action: parsed.data.isPaperTrade ? 'paper_trade_order' : 'trading_order_placed',
      entity_type: 'trading_order',
      entity_id: orderId,
      before_state: null,
      after_state: {
        ticker: parsed.data.ticker,
        side: parsed.data.side,
        orderType: parsed.data.orderType,
        quantity: parsed.data.quantity,
        drawdownCheck: drawdownCheck.action,
      },
      ip_address: req.ip || null,
      created_at: new Date(),
    });

    logger.info('Trading order placed', {
      userId,
      tenantId,
      orderId,
      ticker: parsed.data.ticker,
      side: parsed.data.side,
      isPaper: parsed.data.isPaperTrade,
    });

    res.status(201).json({
      success: true,
      data: {
        id: orderId,
        ticker: parsed.data.ticker,
        side: parsed.data.side,
        orderType: parsed.data.orderType,
        quantity: parsed.data.quantity,
        status: 'pending',
        isPaperTrade: parsed.data.isPaperTrade,
        riskCheck: {
          drawdown: drawdownCheck.currentDrawdown,
          action: drawdownCheck.action,
        },
      },
    });
  } catch (error) {
    logger.error('Failed to place trading order', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to place trading order.',
    });
  }
});

// --- GET /trading/orders ---
tradingRouter.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;
    const status = req.query.status as string | undefined;
    const ticker = req.query.ticker as string | undefined;

    let query = db('trading_orders')
      .where({ user_id: userId, tenant_id: tenantId });

    if (status) query = query.where({ status });
    if (ticker) query = query.where({ ticker });

    const orders = await query.orderBy('created_at', 'desc').limit(100);

    res.json({
      success: true,
      data: orders.map((o: Record<string, unknown>) => ({
        id: o.id,
        ticker: o.ticker,
        side: o.side,
        orderType: o.order_type,
        quantity: o.quantity,
        limitPrice: o.limit_price,
        stopPrice: o.stop_price,
        status: o.status,
        filledQuantity: o.filled_quantity,
        filledAvgPrice: o.filled_avg_price,
        commission: o.commission,
        isPaperTrade: o.is_paper_trade,
        submittedAt: o.submitted_at,
        filledAt: o.filled_at,
        createdAt: o.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch trading orders', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch trading orders.',
    });
  }
});

// --- DELETE /trading/orders/:id ---
tradingRouter.delete('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const order = await db('trading_orders')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId })
      .first();

    if (!order) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Order not found.',
      });
      return;
    }

    if (!['pending', 'submitted'].includes(order.status)) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/invalid-state',
        title: 'Cannot Cancel',
        status: 400,
        detail: `Order in '${order.status}' state cannot be cancelled.`,
      });
      return;
    }

    await db('trading_orders')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId })
      .update({ status: 'cancelled', updated_at: new Date() });

    logger.info('Trading order cancelled', { userId, tenantId, orderId: req.params.id });

    res.json({ success: true, data: { message: 'Order cancelled.' } });
  } catch (error) {
    logger.error('Failed to cancel trading order', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to cancel trading order.',
    });
  }
});

// --- POST /trading/accounts ---
tradingRouter.post('/accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      accountType: z.enum(['individual', 'margin']),
      riskLevel: z.enum(['conservative', 'moderate', 'aggressive']).default('moderate'),
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

    // Check existing active account
    const existing = await db('trading_accounts')
      .where({ user_id: userId, tenant_id: tenantId })
      .whereNot({ status: 'closed' })
      .first();

    if (existing) {
      res.status(409).json({
        type: 'https://api.neobank.io/errors/conflict',
        title: 'Account Exists',
        status: 409,
        detail: 'You already have an active trading account.',
      });
      return;
    }

    const accountId = uuidv4();
    await db('trading_accounts').insert({
      id: accountId,
      tenant_id: tenantId,
      user_id: userId,
      account_type: parsed.data.accountType,
      risk_level: parsed.data.riskLevel,
      status: 'pending_approval',
      cash_balance: 0,
      buying_power: 0,
      portfolio_value: 0,
      peak_value: 0,
      total_pnl: 0,
      day_pnl: 0,
      margin_enabled: parsed.data.accountType === 'margin',
      margin_used: 0,
      external_account_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info('Trading account created', {
      userId,
      tenantId,
      accountId,
      accountType: parsed.data.accountType,
    });

    res.status(201).json({
      success: true,
      data: {
        id: accountId,
        accountType: parsed.data.accountType,
        riskLevel: parsed.data.riskLevel,
        status: 'pending_approval',
      },
    });
  } catch (error) {
    logger.error('Failed to create trading account', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to create trading account.',
    });
  }
});

// --- GET /trading/accounts ---
tradingRouter.get('/accounts', async (req: Request, res: Response): Promise<void> => {
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

    res.json({
      success: true,
      data: {
        id: account.id,
        accountType: account.account_type,
        riskLevel: account.risk_level,
        status: account.status,
        cashBalance: account.cash_balance,
        buyingPower: account.buying_power,
        portfolioValue: account.portfolio_value,
        peakValue: account.peak_value,
        totalPnl: account.total_pnl,
        dayPnl: account.day_pnl,
        marginEnabled: account.margin_enabled,
        marginUsed: account.margin_used,
        createdAt: account.created_at,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch trading account', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch trading account.',
    });
  }
});
