import { normalizeMerchant, batchNormalize } from '../lib/merchant-normalizer';

describe('Merchant Normalizer', () => {
  describe('normalizeMerchant', () => {
    it('should return UNKNOWN for empty input', () => {
      const result = normalizeMerchant('');
      expect(result.normalized).toBe('UNKNOWN');
      expect(result.canonical).toBeNull();
      expect(result.confidence).toBe(0);
    });

    it('should return UNKNOWN for whitespace-only input', () => {
      const result = normalizeMerchant('   ');
      expect(result.normalized).toBe('UNKNOWN');
      expect(result.confidence).toBe(0);
    });

    // Payment processor prefix stripping
    it('should strip SQ * prefix (Square)', () => {
      const result = normalizeMerchant('SQ *STARBUCKS COFFEE');
      expect(result.canonical).toBe('STARBUCKS');
      expect(result.aliasMatched).toBe(true);
    });

    it('should strip TST * prefix (Toast)', () => {
      const result = normalizeMerchant('TST* LOCAL BURGER JOINT');
      expect(result.normalized).not.toContain('TST');
    });

    it('should strip PAYPAL * prefix', () => {
      const result = normalizeMerchant('PAYPAL *NETFLIX.COM');
      expect(result.canonical).toBe('NETFLIX');
      expect(result.aliasMatched).toBe(true);
    });

    it('should strip SP * prefix (Shopify)', () => {
      const result = normalizeMerchant('SP * SMALL BUSINESS STORE');
      expect(result.normalized).not.toContain('SP');
    });

    // Known merchant alias matching
    it('should resolve WALMART variations', () => {
      expect(normalizeMerchant('WAL-MART SUPERCENTER #1234').canonical).toBe('WALMART');
      expect(normalizeMerchant('WALMART STORE 5678').canonical).toBe('WALMART');
      expect(normalizeMerchant('WAL MART GROCERY').canonical).toBe('WALMART');
    });

    it('should resolve AMAZON variations', () => {
      expect(normalizeMerchant('AMAZON.COM*RT5KJ30').canonical).toBe('AMAZON');
      expect(normalizeMerchant('AMZN MKTP US*1234').canonical).toBe('AMAZON');
      expect(normalizeMerchant('AMAZON PRIME*MH2345').canonical).toBe('AMAZON PRIME');
    });

    it('should resolve STARBUCKS variations', () => {
      expect(normalizeMerchant('STARBUCKS #12345').canonical).toBe('STARBUCKS');
      expect(normalizeMerchant('STARBUCKS STORE 99 CA').canonical).toBe('STARBUCKS');
    });

    it('should resolve MCDONALD\'S variations', () => {
      expect(normalizeMerchant('MCDONALD\'S F1234').canonical).toBe("MCDONALD'S");
      expect(normalizeMerchant('MCDONALDS RESTAURANT').canonical).toBe("MCDONALD'S");
    });

    it('should resolve COSTCO', () => {
      expect(normalizeMerchant('COSTCO WHSE #1234').canonical).toBe('COSTCO');
    });

    it('should resolve TARGET', () => {
      expect(normalizeMerchant('TARGET 00012345').canonical).toBe('TARGET');
    });

    it('should resolve gas station brands', () => {
      expect(normalizeMerchant('SHELL OIL 123456').canonical).toBe('SHELL');
      expect(normalizeMerchant('CHEVRON #12345').canonical).toBe('CHEVRON');
      expect(normalizeMerchant('EXXONMOBIL 9876').canonical).toBe('EXXON');
    });

    it('should resolve streaming services', () => {
      expect(normalizeMerchant('NETFLIX.COM').canonical).toBe('NETFLIX');
      expect(normalizeMerchant('SPOTIFY USA').canonical).toBe('SPOTIFY');
      expect(normalizeMerchant('HULU *MONTHLY').canonical).toBe('HULU');
    });

    it('should resolve rideshare services', () => {
      expect(normalizeMerchant('UBER *TRIP').canonical).toBe('UBER');
      expect(normalizeMerchant('LYFT *RIDE').canonical).toBe('LYFT');
      expect(normalizeMerchant('UBER EATS ORDER').canonical).toBe('UBER EATS');
    });

    // Suffix stripping
    it('should strip store numbers', () => {
      const result = normalizeMerchant('RANDOM STORE #5678');
      expect(result.normalized).not.toMatch(/#5678/);
    });

    it('should strip ZIP codes', () => {
      const result = normalizeMerchant('LOCAL SHOP 90210');
      expect(result.normalized).not.toContain('90210');
    });

    it('should strip state + ZIP', () => {
      const result = normalizeMerchant('SOME MERCHANT CA 90210');
      expect(result.normalized).not.toContain('90210');
    });

    // Suggested categories
    it('should suggest grocery category for grocery merchants', () => {
      const result = normalizeMerchant('WHOLE FOODS MARKET #1234');
      expect(result.suggestedCategory).toBe('groceries');
    });

    it('should suggest dining category for restaurant merchants', () => {
      const result = normalizeMerchant('CHIPOTLE ONLINE 1234');
      expect(result.suggestedCategory).toBe('dining');
    });

    it('should suggest gas category for gas station merchants', () => {
      const result = normalizeMerchant('SHELL OIL 12345');
      expect(result.suggestedCategory).toBe('gas');
    });

    it('should suggest subscription category for streaming services', () => {
      const result = normalizeMerchant('NETFLIX.COM');
      expect(result.suggestedCategory).toBe('subscriptions');
    });

    // Confidence scoring
    it('should have high confidence for known merchants', () => {
      const result = normalizeMerchant('STARBUCKS #12345');
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should have lower confidence for unknown merchants', () => {
      const result = normalizeMerchant('RANDOM UNKNOWN STORE');
      expect(result.confidence).toBeLessThan(0.9);
    });
  });

  describe('batchNormalize', () => {
    it('should normalize multiple merchant names', () => {
      const results = batchNormalize([
        'STARBUCKS #1234',
        'WALMART STORE 5678',
        'SQ *LOCAL CAFE',
      ]);
      expect(results).toHaveLength(3);
      expect(results[0].canonical).toBe('STARBUCKS');
      expect(results[1].canonical).toBe('WALMART');
    });

    it('should handle empty array', () => {
      const results = batchNormalize([]);
      expect(results).toEqual([]);
    });
  });
});
