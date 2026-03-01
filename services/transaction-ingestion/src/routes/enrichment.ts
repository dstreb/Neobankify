import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { publishEvent } from '../config/kafka';
import { logger } from '../config/logger';

export const enrichmentRouter = Router();

/**
 * MCC Code to Category mapping for transaction enrichment.
 * In production, this would be a more comprehensive mapping service.
 */
const MCC_CATEGORY_MAP: Record<string, { category: string; subcategory: string }> = {
  '5812': { category: 'dining', subcategory: 'restaurants' },
  '5813': { category: 'dining', subcategory: 'bars_lounges' },
  '5814': { category: 'dining', subcategory: 'fast_food' },
  '5411': { category: 'groceries', subcategory: 'supermarkets' },
  '5422': { category: 'groceries', subcategory: 'meat_markets' },
  '5441': { category: 'groceries', subcategory: 'candy_stores' },
  '5451': { category: 'groceries', subcategory: 'dairy_stores' },
  '5462': { category: 'groceries', subcategory: 'bakeries' },
  '5541': { category: 'gas', subcategory: 'gas_stations' },
  '5542': { category: 'gas', subcategory: 'automated_fuel' },
  '4511': { category: 'travel', subcategory: 'airlines' },
  '4722': { category: 'travel', subcategory: 'travel_agencies' },
  '7011': { category: 'travel', subcategory: 'hotels' },
  '7012': { category: 'travel', subcategory: 'timeshares' },
  '7832': { category: 'entertainment', subcategory: 'movies' },
  '7922': { category: 'entertainment', subcategory: 'events' },
  '7941': { category: 'entertainment', subcategory: 'sports' },
  '4111': { category: 'transportation', subcategory: 'local_transit' },
  '4121': { category: 'transportation', subcategory: 'rideshare' },
  '4900': { category: 'utilities', subcategory: 'utilities' },
  '5815': { category: 'subscriptions', subcategory: 'digital_goods' },
  '5816': { category: 'subscriptions', subcategory: 'digital_games' },
  '5817': { category: 'subscriptions', subcategory: 'software' },
  '5818': { category: 'subscriptions', subcategory: 'streaming' },
};

/**
 * Merchant name normalization.
 * In production, use a merchant enrichment service (e.g., Plaid categories, Finicity).
 */
function normalizeMerchantName(raw: string): string {
  let normalized = raw.trim().toUpperCase();
  // Remove common suffixes
  normalized = normalized.replace(/\s*(#\d+|STORE\s*\d+|LOCATION\s*\d+)\s*$/i, '');
  // Remove city/state suffix
  normalized = normalized.replace(/\s+[A-Z]{2}\s*\d{5}(-\d{4})?$/, '');
  return normalized;
}

// --- POST /enrichment/process ---
// Internal: called by Kafka consumer or batch job to enrich raw transactions
enrichmentRouter.post('/process', async (req: Request, res: Response): Promise<void> => {
  try {
    const { transactionId } = req.body;

    const txn = await db('transactions').where({ id: transactionId }).first();
    if (!txn) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Transaction Not Found',
        status: 404,
        detail: 'Transaction not found.',
      });
      return;
    }

    // Enrich: category from MCC
    const mccMapping = txn.mcc_code ? MCC_CATEGORY_MAP[txn.mcc_code] : null;
    const category = mccMapping?.category || 'other';
    const subcategory = mccMapping?.subcategory || 'uncategorized';
    const merchantNormalized = normalizeMerchantName(txn.merchant_name);

    // Determine reward eligibility based on transaction type (not MCC category)
    const txnType = (txn.transaction_type || '').toLowerCase();
    const rewardEligible = !['cash_advance', 'balance_transfer', 'fee'].includes(txnType);

    // Confidence score based on enrichment quality
    let enrichmentConfidence = 0.5;
    if (mccMapping) enrichmentConfidence += 0.3;
    if (merchantNormalized !== txn.merchant_name) enrichmentConfidence += 0.1;
    enrichmentConfidence = Math.min(enrichmentConfidence, 1.0);

    const enrichmentData = {
      mccCategory: mccMapping,
      merchantNormalized,
      enrichedAt: new Date().toISOString(),
      enrichmentVersion: '1.0',
    };

    // Update transaction with enrichment data
    await db('transactions').where({ id: transactionId }).update({
      category,
      subcategory,
      merchant_normalized: merchantNormalized,
      reward_eligible: rewardEligible,
      enrichment_confidence: enrichmentConfidence,
      enrichment_data: JSON.stringify(enrichmentData),
      updated_at: new Date(),
    });

    // Publish enriched transaction event
    await publishEvent('transactions.enriched', txn.user_id, {
      eventId: uuidv4(),
      eventType: 'transaction.enriched',
      tenantId: txn.tenant_id || req.headers['x-tenant-id'],
      userId: txn.user_id,
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'transaction-enrichment',
      data: {
        transactionId,
        amount: txn.amount,
        merchantName: txn.merchant_name,
        merchantNormalized,
        mccCode: txn.mcc_code,
        category,
        subcategory,
        rewardEligible,
        enrichmentConfidence,
      },
    });

    logger.info('Transaction enriched', { transactionId, category, confidence: enrichmentConfidence });

    res.json({
      success: true,
      data: { transactionId, category, subcategory, merchantNormalized, rewardEligible, enrichmentConfidence },
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
