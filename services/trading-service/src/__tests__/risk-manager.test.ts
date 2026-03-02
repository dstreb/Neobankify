import {
  calculateVaR,
  calculateDrawdown,
  checkDrawdownLimit,
  calculatePositionSize,
  checkConcentrationRisk,
  assessRisk,
} from '../lib/risk-manager';

describe('Risk Manager', () => {
  describe('calculateVaR', () => {
    it('should calculate 1-day VaR correctly', () => {
      // $100,000 portfolio, 2% daily vol, 95% confidence (1.645)
      const var95 = calculateVaR(100000, 0.02, 1.645, 1);
      expect(var95).toBeCloseTo(3290, 0);
    });

    it('should scale VaR by square root of holding period', () => {
      const var1Day = calculateVaR(100000, 0.02, 1.645, 1);
      const var10Day = calculateVaR(100000, 0.02, 1.645, 10);
      expect(var10Day).toBeCloseTo(var1Day * Math.sqrt(10), 0);
    });

    it('should return 0 for zero portfolio value', () => {
      expect(calculateVaR(0, 0.02, 1.645)).toBe(0);
    });

    it('should return 0 for zero volatility', () => {
      expect(calculateVaR(100000, 0, 1.645)).toBe(0);
    });

    it('should default holding period to 1 day', () => {
      const varDefault = calculateVaR(100000, 0.02, 1.645);
      const var1Day = calculateVaR(100000, 0.02, 1.645, 1);
      expect(varDefault).toBe(var1Day);
    });

    it('should produce higher VaR at 99% confidence', () => {
      const var95 = calculateVaR(100000, 0.02, 1.645);
      const var99 = calculateVaR(100000, 0.02, 2.326);
      expect(var99).toBeGreaterThan(var95);
    });
  });

  describe('calculateDrawdown', () => {
    it('should calculate drawdown correctly', () => {
      expect(calculateDrawdown(90000, 100000)).toBeCloseTo(0.1, 4);
    });

    it('should return 0 when at peak', () => {
      expect(calculateDrawdown(100000, 100000)).toBe(0);
    });

    it('should return 0 when above peak', () => {
      expect(calculateDrawdown(110000, 100000)).toBe(0);
    });

    it('should return 0 for zero peak value', () => {
      expect(calculateDrawdown(50000, 0)).toBe(0);
    });

    it('should handle full drawdown (value = 0)', () => {
      expect(calculateDrawdown(0, 100000)).toBe(1);
    });
  });

  describe('checkDrawdownLimit', () => {
    it('should return none action when well within limit', () => {
      const result = checkDrawdownLimit(98000, 100000, 'moderate');
      expect(result.isBreached).toBe(false);
      expect(result.action).toBe('none');
    });

    it('should return warn action at 50% of limit', () => {
      // moderate maxDrawdownPct = 0.10, so 50% = 0.05
      const result = checkDrawdownLimit(94500, 100000, 'moderate');
      expect(result.action).toBe('warn');
    });

    it('should return reduce_exposure at 80% of limit', () => {
      // moderate maxDrawdownPct = 0.10, so 80% = 0.08
      const result = checkDrawdownLimit(91500, 100000, 'moderate');
      expect(result.action).toBe('reduce_exposure');
    });

    it('should return halt_trading when limit breached', () => {
      // moderate maxDrawdownPct = 0.10
      const result = checkDrawdownLimit(89000, 100000, 'moderate');
      expect(result.isBreached).toBe(true);
      expect(result.action).toBe('halt_trading');
    });

    it('should use conservative limits for conservative risk level', () => {
      // conservative maxDrawdownPct = 0.05
      const result = checkDrawdownLimit(94000, 100000, 'conservative');
      expect(result.isBreached).toBe(true);
      expect(result.maxAllowedDrawdown).toBe(0.05);
    });

    it('should use aggressive limits for aggressive risk level', () => {
      // aggressive maxDrawdownPct = 0.20
      const result = checkDrawdownLimit(85000, 100000, 'aggressive');
      expect(result.isBreached).toBe(false);
      expect(result.maxAllowedDrawdown).toBe(0.20);
    });

    it('should default to moderate for unknown risk level', () => {
      const result = checkDrawdownLimit(95000, 100000, 'unknown');
      expect(result.maxAllowedDrawdown).toBe(0.10);
    });
  });

  describe('calculatePositionSize', () => {
    it('should return position size within max limits', () => {
      const result = calculatePositionSize(100000, 150, 0.15, 0.25, 'moderate');
      expect(result.recommendedValueUsd).toBeLessThanOrEqual(result.maxValueUsd);
      expect(result.recommendedShares).toBeLessThanOrEqual(result.maxShares);
    });

    it('should cap at maxPositionPct of portfolio', () => {
      // moderate maxPositionPct = 0.10
      const result = calculatePositionSize(100000, 50, 0.50, 0.10, 'moderate');
      expect(result.maxValueUsd).toBe(10000);
    });

    it('should use half-Kelly for position sizing', () => {
      const result = calculatePositionSize(100000, 100, 0.10, 0.20, 'aggressive');
      expect(result.recommendedShares).toBeGreaterThanOrEqual(0);
      expect(result.explanation).toContain('Half-Kelly');
    });

    it('should return 0 shares when volatility is 0', () => {
      const result = calculatePositionSize(100000, 100, 0.10, 0, 'moderate');
      expect(result.recommendedShares).toBe(0);
    });

    it('should return 0 shares when expected return is 0', () => {
      const result = calculatePositionSize(100000, 100, 0, 0.20, 'moderate');
      expect(result.recommendedShares).toBe(0);
    });

    it('should return 0 shares when expected return is negative', () => {
      const result = calculatePositionSize(100000, 100, -0.05, 0.20, 'moderate');
      expect(result.recommendedShares).toBe(0);
    });

    it('should calculate risk per share', () => {
      const result = calculatePositionSize(100000, 100, 0.10, 0.20, 'moderate');
      expect(result.riskPerShare).toBe(20); // 100 * 0.20
    });

    it('should constrain conservative accounts more', () => {
      const conservative = calculatePositionSize(100000, 100, 0.10, 0.20, 'conservative');
      const aggressive = calculatePositionSize(100000, 100, 0.10, 0.20, 'aggressive');
      expect(conservative.maxValueUsd).toBeLessThan(aggressive.maxValueUsd);
    });
  });

  describe('checkConcentrationRisk', () => {
    it('should flag positions exceeding concentration limit', () => {
      const positions = [
        { ticker: 'AAPL', currentValue: 25000 },
        { ticker: 'GOOGL', currentValue: 5000 },
      ];
      // moderate maxConcentrationPct = 0.20
      const risks = checkConcentrationRisk(positions, 100000, 'moderate');
      expect(risks[0].isExceeded).toBe(true); // AAPL: 25%
      expect(risks[1].isExceeded).toBe(false); // GOOGL: 5%
    });

    it('should calculate correct weights', () => {
      const positions = [
        { ticker: 'AAPL', currentValue: 30000 },
      ];
      const risks = checkConcentrationRisk(positions, 100000, 'moderate');
      expect(risks[0].weight).toBe(0.3);
    });

    it('should use conservative limits for conservative risk level', () => {
      const positions = [
        { ticker: 'AAPL', currentValue: 12000 },
      ];
      // conservative maxConcentrationPct = 0.10
      const risks = checkConcentrationRisk(positions, 100000, 'conservative');
      expect(risks[0].isExceeded).toBe(true);
      expect(risks[0].limit).toBe(0.10);
    });

    it('should handle zero portfolio value', () => {
      const positions = [{ ticker: 'AAPL', currentValue: 5000 }];
      const risks = checkConcentrationRisk(positions, 0, 'moderate');
      expect(risks[0].weight).toBe(0);
      expect(risks[0].isExceeded).toBe(false);
    });

    it('should handle empty positions', () => {
      const risks = checkConcentrationRisk([], 100000, 'moderate');
      expect(risks).toHaveLength(0);
    });
  });

  describe('assessRisk', () => {
    it('should return complete risk metrics', () => {
      const positions = [
        { ticker: 'AAPL', currentValue: 15000 },
        { ticker: 'GOOGL', currentValue: 10000 },
      ];
      const result = assessRisk(100000, 105000, 0.02, positions, 'moderate');
      expect(result).toHaveProperty('portfolioVaR');
      expect(result).toHaveProperty('portfolioVaR95');
      expect(result).toHaveProperty('portfolioVaR99');
      expect(result).toHaveProperty('maxDrawdown');
      expect(result).toHaveProperty('currentDrawdown');
      expect(result).toHaveProperty('sharpeRatio');
      expect(result).toHaveProperty('concentrationRisk');
      expect(result).toHaveProperty('positionLimits');
      expect(result).toHaveProperty('overallRiskLevel');
      expect(result).toHaveProperty('warnings');
    });

    it('should return normal risk level when no issues', () => {
      const positions = [
        { ticker: 'AAPL', currentValue: 5000 },
      ];
      const result = assessRisk(100000, 100000, 0.005, positions, 'aggressive');
      expect(result.overallRiskLevel).toBe('normal');
      expect(result.warnings).toHaveLength(0);
    });

    it('should return critical risk level when drawdown breached', () => {
      const positions = [{ ticker: 'AAPL', currentValue: 5000 }];
      // moderate maxDrawdownPct = 0.10, current = 15% drawdown
      const result = assessRisk(85000, 100000, 0.02, positions, 'moderate');
      expect(result.overallRiskLevel).toBe('critical');
    });

    it('should warn on concentration risk', () => {
      const positions = [
        { ticker: 'AAPL', currentValue: 25000 }, // 25% > 20% moderate limit
      ];
      const result = assessRisk(100000, 100000, 0.01, positions, 'moderate');
      expect(result.warnings.some(w => w.includes('Concentration'))).toBe(true);
    });

    it('should warn on high VaR', () => {
      const positions = [{ ticker: 'AAPL', currentValue: 5000 }];
      // High volatility => VaR exceeds daily loss limit
      const result = assessRisk(100000, 100000, 0.10, positions, 'conservative');
      expect(result.warnings.some(w => w.includes('VaR'))).toBe(true);
    });

    it('should set elevated risk level with multiple warnings', () => {
      const positions = [
        { ticker: 'AAPL', currentValue: 25000 }, // concentration breach
      ];
      // Near drawdown limit + concentration breach = 2 warnings = elevated
      const result = assessRisk(92000, 100000, 0.05, positions, 'moderate');
      expect(result.warnings.length).toBeGreaterThanOrEqual(2);
      expect(result.overallRiskLevel).toBe('elevated');
    });

    it('should include position limits in results', () => {
      const positions = [
        { ticker: 'AAPL', currentValue: 5000 },
        { ticker: 'GOOGL', currentValue: 3000 },
      ];
      const result = assessRisk(100000, 100000, 0.02, positions, 'moderate');
      expect(result.positionLimits).toHaveLength(2);
      expect(result.positionLimits[0].ticker).toBe('AAPL');
    });

    it('should calculate VaR99 > VaR95', () => {
      const positions = [{ ticker: 'AAPL', currentValue: 5000 }];
      const result = assessRisk(100000, 100000, 0.02, positions, 'moderate');
      expect(result.portfolioVaR99).toBeGreaterThan(result.portfolioVaR95);
    });
  });
});
