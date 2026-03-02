import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';

export const accountsRouter = Router();

// --- POST /accounts ---
accountsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      accountType: z.enum(['individual', 'joint', 'ira_traditional', 'ira_roth', 'custodial']),
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

    // Check if user already has this account type
    const existing = await db('investment_accounts')
      .where({ user_id: userId, tenant_id: tenantId, account_type: parsed.data.accountType })
      .whereNot({ status: 'closed' })
      .first();

    if (existing) {
      res.status(409).json({
        type: 'https://api.neobank.io/errors/conflict',
        title: 'Account Exists',
        status: 409,
        detail: `You already have an active ${parsed.data.accountType} account.`,
      });
      return;
    }

    const accountId = uuidv4();
    await db('investment_accounts').insert({
      id: accountId,
      tenant_id: tenantId,
      user_id: userId,
      account_type: parsed.data.accountType,
      status: 'pending_approval',
      cash_balance: 0,
      total_value: 0,
      external_account_id: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info('Investment account created', { userId, tenantId, accountId, accountType: parsed.data.accountType });

    res.status(201).json({
      success: true,
      data: {
        id: accountId,
        accountType: parsed.data.accountType,
        status: 'pending_approval',
        cashBalance: 0,
        totalValue: 0,
      },
    });
  } catch (error) {
    logger.error('Failed to create investment account', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to create investment account.',
    });
  }
});

// --- GET /accounts ---
accountsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const accounts = await db('investment_accounts')
      .where({ user_id: userId, tenant_id: tenantId })
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: accounts.map((a: Record<string, unknown>) => ({
        id: a.id,
        accountType: a.account_type,
        status: a.status,
        cashBalance: a.cash_balance,
        totalValue: a.total_value,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch investment accounts', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch investment accounts.',
    });
  }
});

// --- POST /accounts/:id/deposit ---
accountsRouter.post('/:id/deposit', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      amount: z.number().positive().max(250000),
      fundingSource: z.string().uuid(),
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

    const account = await db('investment_accounts')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Active investment account not found.',
      });
      return;
    }

    const transferId = uuidv4();
    await db('investment_transfers').insert({
      id: transferId,
      account_id: account.id,
      tenant_id: tenantId,
      user_id: userId,
      type: 'deposit',
      amount: parsed.data.amount,
      funding_source_id: parsed.data.fundingSource,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info('Deposit initiated', { userId, tenantId, accountId: account.id, amount: parsed.data.amount });

    res.status(201).json({
      success: true,
      data: {
        transferId,
        type: 'deposit',
        amount: parsed.data.amount,
        status: 'pending',
      },
    });
  } catch (error) {
    logger.error('Failed to initiate deposit', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to initiate deposit.',
    });
  }
});

// --- POST /accounts/:id/withdraw ---
accountsRouter.post('/:id/withdraw', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const schema = z.object({
      amount: z.number().positive(),
      destinationAccount: z.string().uuid(),
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

    const account = await db('investment_accounts')
      .where({ id: req.params.id, user_id: userId, tenant_id: tenantId, status: 'active' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Active investment account not found.',
      });
      return;
    }

    if (account.cash_balance < parsed.data.amount) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/insufficient-funds',
        title: 'Insufficient Funds',
        status: 400,
        detail: `Available cash balance: $${account.cash_balance}. Requested: $${parsed.data.amount}.`,
      });
      return;
    }

    const transferId = uuidv4();
    await db('investment_transfers').insert({
      id: transferId,
      account_id: account.id,
      tenant_id: tenantId,
      user_id: userId,
      type: 'withdrawal',
      amount: parsed.data.amount,
      funding_source_id: parsed.data.destinationAccount,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info('Withdrawal initiated', { userId, tenantId, accountId: account.id, amount: parsed.data.amount });

    res.status(201).json({
      success: true,
      data: {
        transferId,
        type: 'withdrawal',
        amount: parsed.data.amount,
        status: 'pending',
      },
    });
  } catch (error) {
    logger.error('Failed to initiate withdrawal', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to initiate withdrawal.',
    });
  }
});
