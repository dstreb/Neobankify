import { Router, Request, Response } from 'express';
import { z } from 'zod';
import db from '../config/database';
import { logger } from '../config/logger';
import { enrichAndPersist, batchEnrich, RawTransaction } from '../lib/enrichment-pipeline';

export const enrichmentRouter = Router();

// --- POST /enrichment/process ---
// Internal: called by Kafka consumer or batch job to enrich a single transaction
enrichmentRouter.post('/process', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.body;
    const tenantId = req.headers['x-tenant-id'] as string;

    const txn = await db('transactions').where({ id: transactionId, tenant_id: tenantId }).first();
    if (!txn) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Transaction Not Found',
        status: 404,
        detail: 'Transaction not found.',
      });
      return;
    }

    const rawTxn: RawTransaction = {
      id: txn.id,
      userId: txn.user_id,
      tenantId: txn.tenant_id,
      accountId: txn.account_id,
      amount: txn.amount,
      merchantName: txn.merchant_name,
      mccCode: txn.mcc_code,
      transactionDate: txn.transaction_date,
      status: txn.status,
    };

    const result = await enrichAndPersist(rawTxn);

    logger.info('Transaction enriched via API', {
      transactionId,
      category: result.category,
      confidence: result.enrichmentConfidence,
    });

    res.json({
      success: true,
      data: {
        transactionId: result.transactionId,
        category: result.category,
        subcategory: result.subcategory,
        merchantNormalized: result.merchantNormalized,
        merchantCanonical: result.merchantCanonical,
        rewardEligible: result.rewardEligible,
        enrichmentConfidence: result.enrichmentConfidence,
      },
    });
  } catch (error) {
    logger.error('Failed to enrich transaction', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to enrich transaction.',
    });
  }
});

// --- POST /enrichment/batch ---
// Internal: batch enrich unenriched transactions for a tenant
// Uses x-tenant-id header (not body) to enforce tenant isolation
const batchSchema = z.object({
  limit: z.number().int().min(1).max(5000).optional().default(500),
});

enrichmentRouter.post('/batch', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const parsed = batchSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { limit } = parsed.data;
    const result = await batchEnrich({ tenantId, limit });

    res.json({
      success: true,
      data: {
        processed: result.processed,
        errors: result.errors,
      },
    });
  } catch (error) {
    logger.error('Batch enrichment failed', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to run batch enrichment.',
    });
  }
});
