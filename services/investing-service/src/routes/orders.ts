import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';

export const ordersRouter = Router();

const orderSchema = z.object({
  portfolioId: z.string().uuid(),
  ticker: z.string().min(1).max(10),
  side: z.enum(['buy', 'sell']),
  orderType: z.enum(['market', 'limit']),
  quantity: z.number().positive().optional(),
  amountUsd: z.number().positive().optional(),
  limitPrice: z.number().positive().optional(),
  timeInForce: z.enum(['day', 'gtc', 'ioc']).default('day'),
}).refine(
  data => data.quantity !== undefined || data.amountUsd !== undefined,
  { message: 'Either quantity or amountUsd must be provided' },
).refine(
  data => data.orderType !== 'limit' || data.limitPrice !== undefined,
  { message: 'limitPrice is required for limit orders' },
);

// --- POST /orders ---
ordersRouter.post('/', async (req: Request, res: Response): Promise<void> => {
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

    // Verify portfolio belongs to user
    const portfolio = await db('investment_portfolios')
      .where({ id: parsed.data.portfolioId, user_id: userId, tenant_id: tenantId })
      .first();

    if (!portfolio) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Portfolio not found.',
      });
      return;
    }

    // Verify holding exists for sell orders
    if (parsed.data.side === 'sell') {
      const holding = await db('portfolio_holdings')
        .where({ portfolio_id: portfolio.id, tenant_id: tenantId, ticker: parsed.data.ticker })
        .first();

      if (!holding || (parsed.data.quantity && holding.shares < parsed.data.quantity)) {
        res.status(400).json({
          type: 'https://api.neobank.io/errors/insufficient-shares',
          title: 'Insufficient Shares',
          status: 400,
          detail: 'Not enough shares to sell.',
        });
        return;
      }
    }

    const orderId = uuidv4();
    await db('investment_orders').insert({
      id: orderId,
      portfolio_id: parsed.data.portfolioId,
      tenant_id: tenantId,
      user_id: userId,
      ticker: parsed.data.ticker,
      side: parsed.data.side,
      order_type: parsed.data.orderType,
      quantity: parsed.data.quantity || null,
      amount_usd: parsed.data.amountUsd || null,
      limit_price: parsed.data.limitPrice || null,
      time_in_force: parsed.data.timeInForce,
      status: 'pending',
      external_order_id: null,
      filled_quantity: 0,
      filled_price: null,
      filled_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Audit log
    await db('audit_log').insert({
      id: uuidv4(),
      tenant_id: tenantId,
      user_id: userId,
      event_type: 'audit.immutable',
      action: 'investment_order_placed',
      entity_type: 'investment_order',
      entity_id: orderId,
      before_state: null,
      after_state: {
        ticker: parsed.data.ticker,
        side: parsed.data.side,
        orderType: parsed.data.orderType,
        quantity: parsed.data.quantity,
        amountUsd: parsed.data.amountUsd,
      },
      ip_address: req.ip || null,
      created_at: new Date(),
    });

    logger.info('Investment order placed', {
      userId,
      tenantId,
      orderId,
      ticker: parsed.data.ticker,
      side: parsed.data.side,
    });

    res.status(201).json({
      success: true,
      data: {
        id: orderId,
        portfolioId: parsed.data.portfolioId,
        ticker: parsed.data.ticker,
        side: parsed.data.side,
        orderType: parsed.data.orderType,
        status: 'pending',
      },
    });
  } catch (error) {
    logger.error('Failed to place order', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to place investment order.',
    });
  }
});

// --- GET /orders ---
ordersRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;
    const portfolioId = req.query.portfolioId as string | undefined;
    const status = req.query.status as string | undefined;

    let query = db('investment_orders')
      .where({ user_id: userId, tenant_id: tenantId });

    if (portfolioId) query = query.where({ portfolio_id: portfolioId });
    if (status) query = query.where({ status });

    const orders = await query.orderBy('created_at', 'desc').limit(100);

    res.json({
      success: true,
      data: orders.map((o: Record<string, unknown>) => ({
        id: o.id,
        portfolioId: o.portfolio_id,
        ticker: o.ticker,
        side: o.side,
        orderType: o.order_type,
        quantity: o.quantity,
        amountUsd: o.amount_usd,
        limitPrice: o.limit_price,
        status: o.status,
        filledQuantity: o.filled_quantity,
        filledPrice: o.filled_price,
        filledAt: o.filled_at,
        createdAt: o.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch orders', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch investment orders.',
    });
  }
});

// --- DELETE /orders/:id ---
ordersRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const order = await db('investment_orders')
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

    await db('investment_orders')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId })
      .update({ status: 'cancelled', updated_at: new Date() });

    logger.info('Order cancelled', { userId, tenantId, orderId: req.params.id });

    res.json({ success: true, data: { message: 'Order cancelled.' } });
  } catch (error) {
    logger.error('Failed to cancel order', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to cancel order.',
    });
  }
});
