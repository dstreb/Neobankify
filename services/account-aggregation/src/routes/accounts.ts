import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../config/database';
import { logger } from '../config/logger';

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

    // TODO: Exchange public token for access token via Plaid API
    // const plaidClient = getPlaidClient(tenantId);
    // const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token: publicToken });
    // const accessToken = exchangeResponse.data.access_token;
    // const itemId = exchangeResponse.data.item_id;

    // Mock for now
    const accessToken = `access-sandbox-${uuidv4()}`;
    const itemId = `item-${uuidv4().substring(0, 8)}`;

    // TODO: Fetch accounts from Plaid and store each one
    const accountId = uuidv4();

    await db('linked_accounts').insert({
      id: accountId,
      user_id: userId,
      provider: 'plaid',
      provider_account_id: itemId,
      access_token_encrypted: accessToken, // TODO: Encrypt with KMS
      account_type: 'checking',
      institution_name: institutionName,
      mask: '1234',
      current_balance: 0,
      available_balance: 0,
      status: 'active',
      created_at: new Date(),
    });

    logger.info('Account linked', { userId, accountId, institution: institutionName });

    res.status(201).json({
      success: true,
      data: {
        accountId,
        institutionName,
        status: 'active',
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

// --- DELETE /accounts/:id ---
accountsRouter.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    await db('linked_accounts')
      .where({ id: req.params.id, user_id: userId })
      .update({ status: 'disconnected' });

    // TODO: Revoke Plaid access token

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
