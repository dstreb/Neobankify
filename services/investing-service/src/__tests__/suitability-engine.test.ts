import {
  calculateRiskScore,
  getRiskLevel,
  getRecommendedStrategy,
  assessSuitability,
  SuitabilityInput,
} from '../lib/suitability-engine';

describe('Suitability Engine', () => {
  const conservativeInput: SuitabilityInput = {
    riskTolerance: 'conservative',
    investmentHorizon: 'short_term',
    annualIncomeRange: 'under_25k',
    netWorthRange: 'under_25k',
    investmentExperience: 'none',
    investmentObjective: 'capital_preservation',
    liquidityNeeds: 'high',
    isAccreditedInvestor: false,
  };

  const aggressiveInput: SuitabilityInput = {
    riskTolerance: 'aggressive',
    investmentHorizon: 'retirement',
    annualIncomeRange: 'over_500k',
    netWorthRange: 'over_5m',
    investmentExperience: 'extensive',
    investmentObjective: 'aggressive_growth',
    liquidityNeeds: 'low',
    isAccreditedInvestor: true,
  };

  const moderateInput: SuitabilityInput = {
    riskTolerance: 'moderate',
    investmentHorizon: 'medium_term',
    annualIncomeRange: '50k_100k',
    netWorthRange: '100k_500k',
    investmentExperience: 'moderate',
    investmentObjective: 'growth_income',
    liquidityNeeds: 'moderate',
    isAccreditedInvestor: false,
  };

  describe('calculateRiskScore', () => {
    it('should return a low score for conservative inputs', () => {
      const score = calculateRiskScore(conservativeInput);
      expect(score).toBeLessThanOrEqual(20);
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should return a high score for aggressive inputs', () => {
      const score = calculateRiskScore(aggressiveInput);
      expect(score).toBeGreaterThanOrEqual(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return a moderate score for moderate inputs', () => {
      const score = calculateRiskScore(moderateInput);
      expect(score).toBeGreaterThan(30);
      expect(score).toBeLessThan(70);
    });

    it('should clamp score between 0 and 100', () => {
      const score = calculateRiskScore(conservativeInput);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should apply liquidity penalty for high liquidity needs', () => {
      const lowLiquidity = { ...moderateInput, liquidityNeeds: 'low' };
      const highLiquidity = { ...moderateInput, liquidityNeeds: 'high' };
      const scoreLow = calculateRiskScore(lowLiquidity);
      const scoreHigh = calculateRiskScore(highLiquidity);
      expect(scoreLow).toBeGreaterThan(scoreHigh);
    });

    it('should handle unknown values with defaults', () => {
      const unknownInput: SuitabilityInput = {
        ...moderateInput,
        riskTolerance: 'unknown_value',
        investmentHorizon: 'unknown_value',
      };
      const score = calculateRiskScore(unknownInput);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getRiskLevel', () => {
    it('should return conservative for scores 0-20', () => {
      expect(getRiskLevel(0)).toBe('conservative');
      expect(getRiskLevel(10)).toBe('conservative');
      expect(getRiskLevel(20)).toBe('conservative');
    });

    it('should return moderate_conservative for scores 21-40', () => {
      expect(getRiskLevel(21)).toBe('moderate_conservative');
      expect(getRiskLevel(40)).toBe('moderate_conservative');
    });

    it('should return moderate for scores 41-60', () => {
      expect(getRiskLevel(41)).toBe('moderate');
      expect(getRiskLevel(60)).toBe('moderate');
    });

    it('should return moderate_aggressive for scores 61-80', () => {
      expect(getRiskLevel(61)).toBe('moderate_aggressive');
      expect(getRiskLevel(80)).toBe('moderate_aggressive');
    });

    it('should return aggressive for scores above 80', () => {
      expect(getRiskLevel(81)).toBe('aggressive');
      expect(getRiskLevel(100)).toBe('aggressive');
    });
  });

  describe('getRecommendedStrategy', () => {
    it('should return passive_index for capital_preservation', () => {
      expect(getRecommendedStrategy('aggressive', 'capital_preservation')).toBe('passive_index');
    });

    it('should return dividend_income for income objective', () => {
      expect(getRecommendedStrategy('moderate', 'income')).toBe('dividend_income');
    });

    it('should return balanced for moderate risk level', () => {
      expect(getRecommendedStrategy('moderate', 'growth_income')).toBe('balanced');
    });

    it('should return growth for aggressive risk level', () => {
      expect(getRecommendedStrategy('aggressive', 'growth')).toBe('growth');
    });

    it('should return balanced as default for unknown risk level', () => {
      expect(getRecommendedStrategy('unknown', 'growth')).toBe('balanced');
    });
  });

  describe('assessSuitability', () => {
    it('should return a complete suitability result', () => {
      const result = assessSuitability(moderateInput);
      expect(result).toHaveProperty('riskScore');
      expect(result).toHaveProperty('riskLevel');
      expect(result).toHaveProperty('recommendedStrategy');
      expect(result).toHaveProperty('recommendedAllocation');
      expect(result).toHaveProperty('explanation');
      expect(result).toHaveProperty('warnings');
    });

    it('should return allocations that sum to ~1.0', () => {
      const result = assessSuitability(moderateInput);
      const totalAllocation = Object.values(result.recommendedAllocation).reduce((sum, w) => sum + w, 0);
      expect(totalAllocation).toBeCloseTo(1.0, 2);
    });

    it('should generate warnings for aggressive + low income', () => {
      const riskyInput: SuitabilityInput = {
        ...aggressiveInput,
        annualIncomeRange: 'under_25k',
      };
      const result = assessSuitability(riskyInput);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('income'))).toBe(true);
    });

    it('should generate warnings for short horizon + aggressive allocation', () => {
      const riskyInput: SuitabilityInput = {
        ...aggressiveInput,
        investmentHorizon: 'short_term',
      };
      const result = assessSuitability(riskyInput);
      expect(result.warnings.some(w => w.includes('Short investment horizon'))).toBe(true);
    });

    it('should generate warnings for no experience + aggressive growth', () => {
      const riskyInput: SuitabilityInput = {
        ...moderateInput,
        investmentExperience: 'none',
        investmentObjective: 'aggressive_growth',
      };
      const result = assessSuitability(riskyInput);
      expect(result.warnings.some(w => w.includes('no prior experience'))).toBe(true);
    });

    it('should include explanation text', () => {
      const result = assessSuitability(moderateInput);
      expect(result.explanation).toContain('Risk score:');
      expect(result.explanation).toContain('Recommended strategy:');
    });

    it('should have no warnings for conservative well-matched inputs', () => {
      const result = assessSuitability(conservativeInput);
      // Conservative allocation should not trigger the aggressive warnings
      expect(result.warnings.filter(w => w.includes('Aggressive'))).toHaveLength(0);
    });
  });
});
