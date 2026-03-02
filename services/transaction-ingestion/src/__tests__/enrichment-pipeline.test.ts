/**
 * Unit tests for the enrichment pipeline.
 * Tests the pure enrichTransaction function (no DB/Kafka dependencies).
 */
import { enrichTransaction, RawTransaction } from '../lib/enrichment-pipeline';

// Mock database and kafka so enrichTransaction (which is pure) doesn't need them
jest.mock('../config/database', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('../config/kafka', () => ({
  publishEvent: jest.fn(),
}));
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

function makeRawTxn(overrides: Partial<RawTransaction> = {}): RawTransaction {
  return {
    id: 'txn-001',
    userId: 'user-001',
    tenantId: 'tenant-001',
    accountId: 'account-001',
    amount: 25.50,
    merchantName: 'STARBUCKS #12345',
    mccCode: '5814',
    transactionDate: '2026-01-15',
    status: 'posted',
    ...overrides,
  };
}

describe('Enrichment Pipeline', () => {
  describe('enrichTransaction', () => {
    it('should enrich a transaction with MCC code and known merchant', async () => {
      const txn = makeRawTxn({ merchantName: 'STARBUCKS #12345', mccCode: '5814' });
      const result = await enrichTransaction(txn);

      expect(result.transactionId).toBe('txn-001');
      expect(result.category).toBe('dining');
      expect(result.subcategory).toBe('fast_food');
      expect(result.rewardEligible).toBe(true);
      expect(result.enrichmentConfidence).toBeGreaterThan(0.5);
      expect(result.enrichmentVersion).toBe('2.0');
    });

    it('should use MCC category over merchant alias when MCC is available', async () => {
      // Walmart with grocery MCC
      const txn = makeRawTxn({ merchantName: 'WALMART STORE 1234', mccCode: '5411' });
      const result = await enrichTransaction(txn);

      expect(result.category).toBe('groceries');
      expect(result.subcategory).toBe('supermarkets');
    });

    it('should fall back to merchant alias when no MCC code', async () => {
      const txn = makeRawTxn({ merchantName: 'STARBUCKS COFFEE', mccCode: null });
      const result = await enrichTransaction(txn);

      expect(result.category).toBe('dining');
      expect(result.merchantCanonical).toBe('STARBUCKS');
    });

    it('should fall back to Plaid category when no MCC and no alias', async () => {
      const txn = makeRawTxn({
        merchantName: 'RANDOM UNKNOWN SHOP',
        mccCode: null,
        plaidCategory: 'GENERAL_MERCHANDISE',
        plaidDetailedCategory: 'GENERAL_MERCHANDISE_ONLINE_MARKETPLACES',
      });
      const result = await enrichTransaction(txn);

      expect(result.category).toBe('shopping');
    });

    it('should fall back to "other" when no signals available', async () => {
      const txn = makeRawTxn({
        merchantName: 'XYZ UNKNOWN 999',
        mccCode: null,
      });
      const result = await enrichTransaction(txn);

      expect(result.category).toBe('other');
      expect(result.subcategory).toBe('uncategorized');
    });

    it('should mark financial services MCC as non-reward-eligible', async () => {
      const txn = makeRawTxn({ mccCode: '6011', merchantName: 'ATM WITHDRAWAL' });
      const result = await enrichTransaction(txn);

      expect(result.rewardEligible).toBe(false);
    });

    it('should mark dining transactions as reward-eligible', async () => {
      const txn = makeRawTxn({ mccCode: '5812', merchantName: 'LOCAL RESTAURANT' });
      const result = await enrichTransaction(txn);

      expect(result.rewardEligible).toBe(true);
    });

    it('should normalize merchant names', async () => {
      const txn = makeRawTxn({ merchantName: 'SQ *STARBUCKS COFFEE #1234 CA 90210' });
      const result = await enrichTransaction(txn);

      expect(result.merchantCanonical).toBe('STARBUCKS');
    });

    it('should have higher confidence when MCC + merchant alias match', async () => {
      const withBoth = makeRawTxn({ merchantName: 'STARBUCKS', mccCode: '5814' });
      const withMCCOnly = makeRawTxn({ merchantName: 'UNKNOWN CAFE', mccCode: '5814' });
      const withNeither = makeRawTxn({ merchantName: 'RANDOM STORE', mccCode: null });

      const resultBoth = await enrichTransaction(withBoth);
      const resultMCC = await enrichTransaction(withMCCOnly);
      const resultNeither = await enrichTransaction(withNeither);

      expect(resultBoth.enrichmentConfidence).toBeGreaterThan(resultMCC.enrichmentConfidence);
      expect(resultMCC.enrichmentConfidence).toBeGreaterThan(resultNeither.enrichmentConfidence);
    });

    it('should include enrichment metadata', async () => {
      const txn = makeRawTxn({ mccCode: '5812' });
      const result = await enrichTransaction(txn);

      expect(result.enrichmentData).toHaveProperty('enrichedAt');
      expect(result.enrichmentData).toHaveProperty('enrichmentVersion', '2.0');
      expect(result.enrichmentData).toHaveProperty('latencyMs');
      expect(result.enrichmentData.latencyMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle gas station transactions', async () => {
      const txn = makeRawTxn({ merchantName: 'SHELL OIL 12345', mccCode: '5541' });
      const result = await enrichTransaction(txn);

      expect(result.category).toBe('gas');
      expect(result.rewardEligible).toBe(true);
    });

    it('should handle travel transactions', async () => {
      const txn = makeRawTxn({ merchantName: 'UNITED AIRLINES', mccCode: '4511' });
      const result = await enrichTransaction(txn);

      expect(result.category).toBe('travel');
      expect(result.subcategory).toBe('airlines');
    });
  });
});
