import {
  lookupMCC,
  getMCCCodesForCategory,
  getAllCategories,
  isRewardEligible,
  MCC_CATALOG,
} from '../lib/mcc-catalog';

describe('MCC Catalog', () => {
  describe('lookupMCC', () => {
    it('should return correct entry for a known dining MCC code', () => {
      const result = lookupMCC('5812');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('dining');
      expect(result!.subcategory).toBe('restaurants');
      expect(result!.rewardEligible).toBe(true);
    });

    it('should return correct entry for a grocery MCC code', () => {
      const result = lookupMCC('5411');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('groceries');
      expect(result!.subcategory).toBe('supermarkets');
    });

    it('should return correct entry for a gas station MCC code', () => {
      const result = lookupMCC('5541');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('gas');
      expect(result!.subcategory).toBe('gas_stations');
    });

    it('should return correct entry for an airline MCC code', () => {
      const result = lookupMCC('4511');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('travel');
      expect(result!.subcategory).toBe('airlines');
    });

    it('should return correct entry for a hotel MCC code', () => {
      const result = lookupMCC('7011');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('travel');
      expect(result!.subcategory).toBe('hotels');
    });

    it('should return correct entry for a streaming/subscription MCC code', () => {
      const result = lookupMCC('5818');
      expect(result).not.toBeNull();
      expect(result!.category).toBe('subscriptions');
      expect(result!.subcategory).toBe('streaming');
    });

    it('should return null for an unknown MCC code', () => {
      const result = lookupMCC('9999');
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = lookupMCC('');
      expect(result).toBeNull();
    });

    it('should return non-reward-eligible for financial services MCC', () => {
      const result = lookupMCC('6011');
      expect(result).not.toBeNull();
      expect(result!.rewardEligible).toBe(false);
    });
  });

  describe('getMCCCodesForCategory', () => {
    it('should return multiple codes for dining category', () => {
      const codes = getMCCCodesForCategory('dining');
      expect(codes.length).toBeGreaterThan(0);
      expect(codes).toContain('5812');
      expect(codes).toContain('5813');
      expect(codes).toContain('5814');
    });

    it('should return multiple codes for travel category', () => {
      const codes = getMCCCodesForCategory('travel');
      expect(codes.length).toBeGreaterThan(5);
    });

    it('should return empty array for non-existent category', () => {
      const codes = getMCCCodesForCategory('nonexistent');
      expect(codes).toEqual([]);
    });
  });

  describe('getAllCategories', () => {
    it('should return all major categories', () => {
      const categories = getAllCategories();
      expect(categories).toContain('dining');
      expect(categories).toContain('groceries');
      expect(categories).toContain('gas');
      expect(categories).toContain('travel');
      expect(categories).toContain('entertainment');
      expect(categories).toContain('shopping');
      expect(categories).toContain('subscriptions');
      expect(categories).toContain('utilities');
    });

    it('should return unique categories', () => {
      const categories = getAllCategories();
      const unique = [...new Set(categories)];
      expect(categories.length).toBe(unique.length);
    });
  });

  describe('isRewardEligible', () => {
    it('should return true for dining MCC codes', () => {
      expect(isRewardEligible('5812')).toBe(true);
    });

    it('should return true for grocery MCC codes', () => {
      expect(isRewardEligible('5411')).toBe(true);
    });

    it('should return false for financial services MCC codes', () => {
      expect(isRewardEligible('6011')).toBe(false);
    });

    it('should return true for unknown MCC codes (default eligible)', () => {
      expect(isRewardEligible('9999')).toBe(true);
    });
  });

  describe('catalog coverage', () => {
    it('should contain at least 200 MCC codes', () => {
      const codeCount = Object.keys(MCC_CATALOG).length;
      expect(codeCount).toBeGreaterThanOrEqual(200);
    });

    it('should have valid entries for all codes', () => {
      for (const [code, entry] of Object.entries(MCC_CATALOG)) {
        expect(code).toMatch(/^\d{4}$/);
        expect(entry.category).toBeTruthy();
        expect(entry.subcategory).toBeTruthy();
        expect(entry.description).toBeTruthy();
        expect(typeof entry.rewardEligible).toBe('boolean');
      }
    });
  });
});
