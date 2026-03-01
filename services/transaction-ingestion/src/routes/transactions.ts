import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../config/database';
import { publishEvent } from '../config/kafka';
import { logger } from '../config/logger';

export const transactionRouter = Router();

// --- GET /transactions ---
transactionRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);
    const cursor = req.query.cursor as string | undefined;

    let query = db('transactions')
      .where({ user_id: userId })
      .orderBy('transaction_date', 'desc')
      .limit(limit + 1);

    if (cursor) {
      query = query.where('transaction_date', '<', cursor);
    }

    const rows = await query;
    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);

    res.json({
      success: true,
      data: data.map(t => ({
        id: t.id,
        accountId: t.account_id,
        amount: t.amount,
        merchantName: t.merchant_name,
        merchantNormalized: t.merchant_normalized,
        mccCode: t.mcc_code,
        category: t.category,
        subcategory: t.subcategory,
        transactionDate: t.transaction_date,
        status: t.status,
        rewardEligible: t.reward_eligible,
        enrichmentConfidence: t.enrichment_confidence,
      })),
      meta: {
        cursor: hasMore ? data[data.length - 1].transaction_date : null,
        hasMore,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch transactions', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch transactions.',
    });
  }
});

// --- GET /transactions/:id ---
transactionRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;

    const txn = await db('transactions')
      .where({ id: req.params.id, user_id: userId })
      .first();

    if (!txn) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Transaction Not Found',
        status: 404,
        detail: 'Transaction not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: txn.id,
        accountId: txn.account_id,
        amount: txn.amount,
        merchantName: txn.merchant_name,
        merchantNormalized: txn.merchant_normalized,
        mccCode: txn.mcc_code,
        category: txn.category,
        subcategory: txn.subcategory,
        transactionDate: txn.transaction_date,
        status: txn.status,
        rewardEligible: txn.reward_eligible,
        enrichmentConfidence: txn.enrichment_confidence,
        enrichmentData: txn.enrichment_data ? JSON.parse(txn.enrichment_data) : null,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch transaction', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch transaction.',
    });
  }
});

// --- POST /transactions/ingest ---
// Internal endpoint: called by account-aggregation when Plaid sync delivers new transactions
const ingestSchema = z.object({
  accountId: z.string().uuid(),
  providerTransactionId: z.string(),
  amount: z.number(),
  merchantName: z.string(),
  mccCode: z.string().optional(),
  transactionDate: z.string(),
  pending: z.boolean().optional().default(false),
});

transactionRouter.post('/ingest', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = ingestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { accountId, providerTransactionId, amount, merchantName, mccCode, transactionDate, pending } = parsed.data;

    const txnId = uuidv4();
    await db('transactions').insert({
      id: txnId,
      user_id: userId,
      account_id: accountId,
      provider_transaction_id: providerTransactionId,
      amount,
      merchant_name: merchantName,
      mcc_code: mccCode || null,
      transaction_date: transactionDate,
      status: pending ? 'pending' : 'posted',
      created_at: new Date(),
    });

    // Publish raw transaction event to Kafka for enrichment pipeline
    await publishEvent('transactions.raw', userId, {
      eventId: uuidv4(),
      eventType: 'transaction.raw',
      tenantId,
      userId,
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'transaction-ingestion',
      data: {
        transactionId: txnId,
        providerTransactionId,
        amount,
        merchantName,
        mccCode,
        transactionDate,
        pending,
      },
    });

    logger.info('Transaction ingested', { userId, txnId, amount, merchant: merchantName });

    res.status(201).json({
      success: true,
      data: { transactionId: txnId, status: 'ingested' },
    });
  } catch (error) {
    logger.error('Failed to ingest transaction', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to ingest transaction.',
    });
  }
});
