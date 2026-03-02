import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../config/database';
import { logger } from '../config/logger';
import {
  createPlaidClient,
  createLinkToken,
  PlaidTenantConfig,
} from '../lib/plaid-client';
import { handleLinkCompletion, refreshBalances, disconnectItem } from '../lib/plaid-sync';

const DEFAULT_TENANT_CONFIG: PlaidTenantConfig = {
  clientId: process.env.PLAID_CLIENT_ID || '',
  secret: process.env.PLAID_SECRET || '',
  environment: (process.env.PLAID_ENV as PlaidTenantConfig['environment']) || 'sandbox',
  webhookUrl: process.env.PLAID_WEBHOOK_URL || 'https://api.neobank.io/v1/webhooks/plaid',
  products: ['transactions', 'auth'],
  countryCodes: ['US'],
};

export const accountsRouter = Router();

// --- GET /accounts ---
accountsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const accounts = await db('linked_accounts')
      .where({ user_id: userId, status: 'active' })
      .orderBy('created_at', 'desc');

    res.json({
      success: true,
      data: accounts.map(a => ({
        id: a.id,
        provider: a.provider,
        accountType: a.account_type,
        institutionName: a.institution_name,
        mask: a.mask,
        currentBalance: a.current_balance,
        availableBalance: a.available_balance,
        creditLimit: a.credit_limit,
        lastSyncedAt: a.last_synced_at,
        status: a.status,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch accounts', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch linked accounts.',
    });
  }
});

// --- POST /accounts/link-token ---
// Creates a Plaid Link token for the frontend
accountsRouter.post('/link-token', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { accessToken } = req.body; // For update mode (re-auth)

    const client = createPlaidClient(DEFAULT_TENANT_CONFIG);
    const result = await createLinkToken(client, {
      userId,
      tenantConfig: DEFAULT_TENANT_CONFIG,
      accessToken,
    });

    res.json({
      success: true,
      data: {
        linkToken: result.linkToken,
        expiration: result.expiration,
      },
    });
  } catch (error) {
    logger.error('Failed to create link token', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to create link token.',
    });
  }
});

// --- POST /accounts/link ---
const linkAccountSchema = z.object({
  publicToken: z.string(),
  institutionId: z.string(),
  institutionName: z.string(),
});

accountsRouter.post('/link', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = linkAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { publicToken, institutionId, institutionName } = parsed.data;

    // Use the full Plaid sync service for Link completion
    const result = await handleLinkCompletion({
      userId,
      tenantId,
      publicToken,
      institutionId,
      institutionName,
      tenantConfig: DEFAULT_TENANT_CONFIG,
    });

    logger.info('Account linked via Plaid', { userId, itemId: result.itemId, accounts: result.accounts.length });

    res.status(201).json({
      success: true,
      data: {
        itemId: result.itemId,
        accounts: result.accounts,
        message: 'Account linked successfully. Initial sync in progress.',
      },
    });
  } catch (error) {
    logger.error('Failed to link account', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to link account.',
    });
  }
});

// --- POST /accounts/:id/refresh ---
// Refresh balances for a linked account's Plaid item
accountsRouter.post('/:id/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const account = await db('linked_accounts')
      .where({ id: req.params.id, user_id: userId, status: 'active' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Account Not Found',
        status: 404,
        detail: 'Account not found.',
      });
      return;
    }

    if (!account.plaid_item_id) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Plaid Item Not Found',
        status: 404,
        detail: 'No active Plaid connection found for this account.',
      });
      return;
    }

    const updated = await refreshBalances({
      plaidItemDbId: account.plaid_item_id,
      tenantId,
      tenantConfig: DEFAULT_TENANT_CONFIG,
    });

    res.json({
      success: true,
      data: { accountsUpdated: updated, message: 'Balances refreshed.' },
    });
  } catch (error) {
    logger.error('Failed to refresh balances', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to refresh account balances.',
    });
  }
});

// --- DELETE /accounts/:id ---
accountsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    // Find the specific account being deleted
    const account = await db('linked_accounts')
      .where({ id: req.params.id, user_id: userId, status: 'active' })
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Account Not Found',
        status: 404,
        detail: 'Account not found.',
      });
      return;
    }

    if (account.plaid_item_id) {
      await disconnectItem({
        plaidItemDbId: account.plaid_item_id,
        userId,
        tenantId,
        tenantConfig: DEFAULT_TENANT_CONFIG,
      });
    } else {
      // Non-Plaid account or legacy account without plaid_item_id
      await db('linked_accounts')
        .where({ id: req.params.id, user_id: userId })
        .update({ status: 'disconnected', updated_at: new Date() });
    }

    res.json({ success: true, data: { message: 'Account unlinked.' } });
  } catch (error) {
    logger.error('Failed to unlink account', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to unlink account.',
    });
  }
});

// --- GET /accounts/:id/balance ---
accountsRouter.get('/:id/balance', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const account = await db('linked_accounts')
      .where({ id: req.params.id, user_id: userId })
      .select('current_balance', 'available_balance', 'credit_limit', 'last_synced_at')
      .first();

    if (!account) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Account Not Found',
        status: 404,
        detail: 'Account not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        currentBalance: account.current_balance,
        availableBalance: account.available_balance,
        creditLimit: account.credit_limit,
        lastSyncedAt: account.last_synced_at,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch balance', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch account balance.',
    });
  }
});
