/**
 * Transaction Enrichment Pipeline
 *
 * Processes raw transactions through multiple enrichment stages:
 * 1. MCC code lookup → category/subcategory assignment
 * 2. Merchant name normalization → canonical name resolution
 * 3. Reward eligibility determination
 * 4. Confidence scoring
 * 5. Plaid category integration (when available)
 *
 * Designed to run both as a real-time Kafka consumer and as a batch job.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { publishEvent } from '../config/kafka';
import { lookupMCC, isRewardEligible, MCCEntry } from './mcc-catalog';
import { normalizeMerchant, NormalizationResult } from './merchant-normalizer';
import { logger } from '../config/logger';

export interface RawTransaction {
  id: string;
  userId: string;
  tenantId: string;
  accountId: string;
  amount: number;
  merchantName: string;
  mccCode: string | null;
  transactionDate: string;
  status: string;
  plaidCategory?: string | null;
  plaidDetailedCategory?: string | null;
}

export interface EnrichmentResult {
  transactionId: string;
  category: string;
  subcategory: string;
  merchantNormalized: string;
  merchantCanonical: string | null;
  rewardEligible: boolean;
  enrichmentConfidence: number;
  enrichmentData: Record<string, unknown>;
  enrichmentVersion: string;
}

const ENRICHMENT_VERSION = '2.0';

/**
 * Enrich a single transaction through the full pipeline.
 */
export async function enrichTransaction(txn: RawTransaction): Promise<EnrichmentResult> {
  const startTime = Date.now();

  // Stage 1: MCC lookup
  const mccEntry = txn.mccCode ? lookupMCC(txn.mccCode) : null;

  // Stage 2: Merchant normalization
  const merchantResult = normalizeMerchant(txn.merchantName);

  // Stage 3: Category resolution (MCC > merchant alias > Plaid category > fallback)
  const { category, subcategory } = resolveCategory(mccEntry, merchantResult, txn);

  // Stage 4: Reward eligibility
  const rewardEligible = determineRewardEligibility(txn.mccCode, category);

  // Stage 5: Confidence scoring
  const confidence = calculateConfidence(mccEntry, merchantResult, txn);

  // Build enrichment data
  const enrichmentData: Record<string, unknown> = {
    mccCategory: mccEntry ? { category: mccEntry.category, subcategory: mccEntry.subcategory } : null,
    mccDescription: mccEntry?.description || null,
    merchantNormalized: merchantResult.normalized,
    merchantCanonical: merchantResult.canonical,
    merchantAliasMatched: merchantResult.aliasMatched,
    plaidCategory: txn.plaidCategory || null,
    plaidDetailedCategory: txn.plaidDetailedCategory || null,
    enrichedAt: new Date().toISOString(),
    enrichmentVersion: ENRICHMENT_VERSION,
    latencyMs: Date.now() - startTime,
  };

  return {
    transactionId: txn.id,
    category,
    subcategory,
    merchantNormalized: merchantResult.canonical || merchantResult.normalized,
    merchantCanonical: merchantResult.canonical,
    rewardEligible,
    enrichmentConfidence: confidence,
    enrichmentData,
    enrichmentVersion: ENRICHMENT_VERSION,
  };
}

/**
 * Enrich a transaction and persist the results to the database.
 */
export async function enrichAndPersist(txn: RawTransaction): Promise<EnrichmentResult> {
  const result = await enrichTransaction(txn);

  // Update transaction in DB
  await db('transactions')
    .where({ id: txn.id, tenant_id: txn.tenantId })
    .update({
      category: result.category,
      subcategory: result.subcategory,
      merchant_normalized: result.merchantNormalized,
      reward_eligible: result.rewardEligible,
      enrichment_confidence: result.enrichmentConfidence,
      enrichment_data: JSON.stringify(result.enrichmentData),
      updated_at: new Date(),
    });

  // Publish enriched event to Kafka
  try {
    await publishEvent('transactions.enriched', txn.userId, {
      eventId: uuidv4(),
      eventType: 'transaction.enriched',
      tenantId: txn.tenantId,
      userId: txn.userId,
      timestamp: new Date().toISOString(),
      version: 1,
      source: 'enrichment-pipeline',
      data: {
        transactionId: txn.id,
        amount: txn.amount,
        merchantName: txn.merchantName,
        merchantNormalized: result.merchantNormalized,
        merchantCanonical: result.merchantCanonical,
        mccCode: txn.mccCode,
        category: result.category,
        subcategory: result.subcategory,
        rewardEligible: result.rewardEligible,
        enrichmentConfidence: result.enrichmentConfidence,
      },
    });
  } catch (error) {
    logger.warn('Failed to publish enriched event to Kafka', {
      transactionId: txn.id,
      error: (error as Error).message,
    });
    // Non-fatal: enrichment data is already persisted
  }

  logger.info('Transaction enriched', {
    transactionId: txn.id,
    category: result.category,
    confidence: result.enrichmentConfidence,
    aliasMatched: result.merchantCanonical !== null,
  });

  return result;
}

/**
 * Batch enrich unenriched transactions.
 * Used by the scheduled batch job.
 */
export async function batchEnrich(params: {
  tenantId: string;
  limit?: number;
}): Promise<{ processed: number; errors: number }> {
  const limit = params.limit || 500;

  // Fetch unenriched transactions
  const transactions = await db('transactions')
    .where({ tenant_id: params.tenantId })
    .whereNull('enrichment_confidence')
    .orderBy('created_at', 'asc')
    .limit(limit);

  let processed = 0;
  let errors = 0;

  for (const row of transactions) {
    try {
      // Extract Plaid categories from enrichment_data if stored during Plaid sync,
      // so the enrichment pipeline can use them as a fallback instead of defaulting to 'other'.
      const existingEnrichment = row.enrichment_data
        ? (typeof row.enrichment_data === 'string' ? JSON.parse(row.enrichment_data) : row.enrichment_data)
        : {};

      const txn: RawTransaction = {
        id: row.id,
        userId: row.user_id,
        tenantId: row.tenant_id,
        accountId: row.account_id,
        amount: row.amount,
        merchantName: row.merchant_name,
        mccCode: row.mcc_code,
        transactionDate: row.transaction_date,
        status: row.status,
        plaidCategory: existingEnrichment.plaidCategory || row.category || null,
        plaidDetailedCategory: existingEnrichment.plaidDetailedCategory || row.subcategory || null,
      };

      await enrichAndPersist(txn);
      processed++;
    } catch (error) {
      errors++;
      logger.error('Batch enrichment failed for transaction', {
        transactionId: row.id,
        error: (error as Error).message,
      });
    }
  }

  logger.info('Batch enrichment complete', {
    tenantId: params.tenantId,
    processed,
    errors,
    total: transactions.length,
  });

  return { processed, errors };
}

/**
 * Resolve the final category using priority: MCC > merchant alias > Plaid > fallback.
 */
function resolveCategory(
  mccEntry: MCCEntry | null,
  merchantResult: NormalizationResult,
  txn: RawTransaction,
): { category: string; subcategory: string } {
  // Priority 1: MCC code (most reliable)
  if (mccEntry) {
    return { category: mccEntry.category, subcategory: mccEntry.subcategory };
  }

  // Priority 2: Merchant alias match (high confidence known merchants)
  if (merchantResult.aliasMatched && merchantResult.suggestedCategory) {
    return { category: merchantResult.suggestedCategory, subcategory: 'general' };
  }

  // Priority 3: Plaid personal finance category (when available)
  if (txn.plaidCategory) {
    return mapPlaidCategory(txn.plaidCategory, txn.plaidDetailedCategory);
  }

  // Fallback
  return { category: 'other', subcategory: 'uncategorized' };
}

/**
 * Map Plaid personal finance categories to our internal categories.
 */
function mapPlaidCategory(
  primary: string,
  detailed?: string | null,
): { category: string; subcategory: string } {
  const categoryMap: Record<string, string> = {
    FOOD_AND_DRINK: 'dining',
    GENERAL_MERCHANDISE: 'shopping',
    GENERAL_SERVICES: 'services',
    TRANSPORTATION: 'transportation',
    TRAVEL: 'travel',
    ENTERTAINMENT: 'entertainment',
    GROCERIES: 'groceries',
    GAS: 'gas',
    UTILITIES: 'utilities',
    HOME_IMPROVEMENT: 'home_improvement',
    MEDICAL: 'health',
    EDUCATION: 'education',
    GOVERNMENT_AND_NON_PROFIT: 'government',
    PERSONAL_CARE: 'services',
    RENT_AND_UTILITIES: 'utilities',
    TRANSFER_IN: 'financial',
    TRANSFER_OUT: 'financial',
    LOAN_PAYMENTS: 'financial',
    BANK_FEES: 'financial',
    INCOME: 'financial',
  };

  const category = categoryMap[primary] || 'other';
  const subcategory = detailed
    ? detailed.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    : 'general';

  return { category, subcategory };
}

/**
 * Determine reward eligibility based on MCC code and category.
 */
function determineRewardEligibility(mccCode: string | null, category: string): boolean {
  // Check MCC-based eligibility first
  if (mccCode) {
    return isRewardEligible(mccCode);
  }

  // Category-based fallback
  const nonRewardCategories = new Set(['financial']);
  return !nonRewardCategories.has(category);
}

/**
 * Calculate enrichment confidence score (0.0 - 1.0).
 */
function calculateConfidence(
  mccEntry: MCCEntry | null,
  merchantResult: NormalizationResult,
  txn: RawTransaction,
): number {
  let confidence = 0.3; // Base confidence

  // MCC code present and found in catalog
  if (mccEntry) {
    confidence += 0.35;
  } else if (txn.mccCode) {
    // MCC present but not in our catalog
    confidence += 0.1;
  }

  // Merchant normalization quality
  confidence += merchantResult.confidence * 0.25;

  // Merchant alias match (strong signal)
  if (merchantResult.aliasMatched) {
    confidence += 0.1;
  }

  // Plaid category available (additional signal)
  if (txn.plaidCategory) {
    confidence += 0.1;
  }

  return Math.min(confidence, 1.0);
}
