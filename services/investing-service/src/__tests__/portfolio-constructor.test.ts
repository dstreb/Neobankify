import {
  constructPortfolio,
  calculateRebalanceActions,
  findTaxLossHarvestingOpportunities,
  getEtfForAssetClass,
} from '../lib/portfolio-constructor';

describe('Portfolio Constructor', () => {
  const moderateAllocation = {
    us_large_cap: 0.35,
    us_bonds: 0.25,
    international_developed: 0.15,
    us_mid_cap: 0.10,
    emerging_markets: 0.05,
    reits: 0.05,
    short_term_treasury: 0.05,
  };

  describe('constructPortfolio', () => {
    it('should construct a portfolio with correct allocations', () => {
      const portfolio = constructPortfolio(moderateAllocation, 100000);
      expect(portfolio.allocations.length).toBe(7);
      expect(portfolio.totalInvestment).toBe(100000);
    });

    it('should calculate expected return and risk', () => {
      const portfolio = constructPortfolio(moderateAllocation, 100000);
      expect(portfolio.expectedReturn).toBeGreaterThan(0);
      expect(portfolio.expectedRisk).toBeGreaterThan(0);
      expect(portfolio.sharpeRatio).toBeGreaterThan(0);
    });

    it('should set rebalance threshold to 5%', () => {
      const portfolio = constructPortfolio(moderateAllocation, 100000);
      expect(portfolio.rebalanceThreshold).toBe(0.05);
    });

    it('should map to correct ETF tickers', () => {
      const portfolio = constructPortfolio(moderateAllocation, 50000);
      const vti = portfolio.allocations.find(a => a.etfTicker === 'VTI');
      expect(vti).toBeDefined();
      expect(vti!.assetClass).toBe('us_large_cap');
      expect(vti!.targetWeight).toBe(0.35);
    });

    it('should set currentWeight equal to targetWeight on initial construction', () => {
      const portfolio = constructPortfolio(moderateAllocation, 100000);
      for (const alloc of portfolio.allocations) {
        expect(alloc.currentWeight).toBe(alloc.targetWeight);
      }
    });

    it('should skip unknown asset classes', () => {
      const withUnknown = { ...moderateAllocation, unknown_asset: 0.10 };
      const portfolio = constructPortfolio(withUnknown, 100000);
      expect(portfolio.allocations.find(a => a.assetClass === 'unknown_asset')).toBeUndefined();
    });

    it('should handle zero investment', () => {
      const portfolio = constructPortfolio(moderateAllocation, 0);
      expect(portfolio.totalInvestment).toBe(0);
      expect(portfolio.expectedReturn).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateRebalanceActions', () => {
    it('should generate buy/sell actions for drifted portfolio', () => {
      const allocations = [
        { assetClass: 'us_large_cap', targetWeight: 0.35, currentWeight: 0.42, etfTicker: 'VTI', etfName: 'Vanguard Total Stock Market ETF' },
        { assetClass: 'us_bonds', targetWeight: 0.25, currentWeight: 0.18, etfTicker: 'BND', etfName: 'Vanguard Total Bond Market ETF' },
      ];
      const prices = { VTI: 200, BND: 75 };
      const actions = calculateRebalanceActions(allocations, 100000, prices);

      expect(actions.length).toBe(2);
      const sellAction = actions.find(a => a.action === 'sell');
      const buyAction = actions.find(a => a.action === 'buy');
      expect(sellAction).toBeDefined();
      expect(buyAction).toBeDefined();
      expect(sellAction!.etfTicker).toBe('VTI');
      expect(buyAction!.etfTicker).toBe('BND');
    });

    it('should sort sells before buys', () => {
      const allocations = [
        { assetClass: 'us_large_cap', targetWeight: 0.30, currentWeight: 0.40, etfTicker: 'VTI', etfName: 'V' },
        { assetClass: 'us_bonds', targetWeight: 0.30, currentWeight: 0.20, etfTicker: 'BND', etfName: 'B' },
      ];
      const actions = calculateRebalanceActions(allocations, 100000, { VTI: 200, BND: 75 });
      if (actions.length >= 2) {
        expect(actions[0].action).toBe('sell');
      }
    });

    it('should skip tiny drifts less than 1%', () => {
      const allocations = [
        { assetClass: 'us_large_cap', targetWeight: 0.35, currentWeight: 0.355, etfTicker: 'VTI', etfName: 'V' },
      ];
      const actions = calculateRebalanceActions(allocations, 100000, { VTI: 200 });
      expect(actions.length).toBe(0);
    });

    it('should skip actions where shares would be 0', () => {
      const allocations = [
        { assetClass: 'us_large_cap', targetWeight: 0.35, currentWeight: 0.36, etfTicker: 'VTI', etfName: 'V' },
      ];
      // With $100 portfolio and $200 price, 1% drift = $1 < 1 share
      const actions = calculateRebalanceActions(allocations, 100, { VTI: 200 });
      expect(actions.length).toBe(0);
    });
  });

  describe('findTaxLossHarvestingOpportunities', () => {
    it('should find opportunities for holdings with losses > $50', () => {
      const holdings = [
        { assetClass: 'us_large_cap', ticker: 'VTI', costBasis: 10000, currentValue: 9800, holdingDays: 60 },
        { assetClass: 'us_bonds', ticker: 'BND', costBasis: 5000, currentValue: 4900, holdingDays: 90 },
      ];
      const opportunities = findTaxLossHarvestingOpportunities(holdings, 0.35);
      expect(opportunities.length).toBe(2);
      expect(opportunities[0].unrealizedLoss).toBe(200);
      expect(opportunities[0].replacementTicker).toBe('ITOT');
    });

    it('should skip holdings with losses <= $50', () => {
      const holdings = [
        { assetClass: 'us_large_cap', ticker: 'VTI', costBasis: 10000, currentValue: 9960, holdingDays: 60 },
      ];
      const opportunities = findTaxLossHarvestingOpportunities(holdings, 0.35);
      expect(opportunities.length).toBe(0);
    });

    it('should flag wash sale risk for holdings held < 30 days', () => {
      const holdings = [
        { assetClass: 'us_large_cap', ticker: 'VTI', costBasis: 10000, currentValue: 9800, holdingDays: 15 },
      ];
      const opportunities = findTaxLossHarvestingOpportunities(holdings, 0.35);
      expect(opportunities[0].washSaleRisk).toBe(true);
    });

    it('should not flag wash sale risk for holdings held >= 30 days', () => {
      const holdings = [
        { assetClass: 'us_large_cap', ticker: 'VTI', costBasis: 10000, currentValue: 9800, holdingDays: 60 },
      ];
      const opportunities = findTaxLossHarvestingOpportunities(holdings, 0.35);
      expect(opportunities[0].washSaleRisk).toBe(false);
    });

    it('should calculate estimated tax savings correctly', () => {
      const holdings = [
        { assetClass: 'us_large_cap', ticker: 'VTI', costBasis: 10000, currentValue: 9000, holdingDays: 60 },
      ];
      const opportunities = findTaxLossHarvestingOpportunities(holdings, 0.35);
      expect(opportunities[0].unrealizedLoss).toBe(1000);
      expect(opportunities[0].estimatedTaxSavings).toBe(350);
    });

    it('should sort by largest tax savings first', () => {
      const holdings = [
        { assetClass: 'us_bonds', ticker: 'BND', costBasis: 5000, currentValue: 4800, holdingDays: 60 },
        { assetClass: 'us_large_cap', ticker: 'VTI', costBasis: 10000, currentValue: 9000, holdingDays: 60 },
      ];
      const opportunities = findTaxLossHarvestingOpportunities(holdings, 0.35);
      expect(opportunities[0].estimatedTaxSavings).toBeGreaterThan(opportunities[1].estimatedTaxSavings);
    });

    it('should swap secondary ticker when holding primary', () => {
      const holdings = [
        { assetClass: 'us_large_cap', ticker: 'VTI', costBasis: 10000, currentValue: 9800, holdingDays: 60 },
      ];
      const result = findTaxLossHarvestingOpportunities(holdings, 0.35);
      expect(result[0].replacementTicker).toBe('ITOT');
    });

    it('should swap primary ticker when holding secondary', () => {
      const holdings = [
        { assetClass: 'us_large_cap', ticker: 'ITOT', costBasis: 10000, currentValue: 9800, holdingDays: 60 },
      ];
      const result = findTaxLossHarvestingOpportunities(holdings, 0.35);
      expect(result[0].replacementTicker).toBe('VTI');
    });
  });

  describe('getEtfForAssetClass', () => {
    it('should return primary and secondary tickers for known asset classes', () => {
      const etf = getEtfForAssetClass('us_large_cap');
      expect(etf).toBeDefined();
      expect(etf!.primary.ticker).toBe('VTI');
      expect(etf!.secondary.ticker).toBe('ITOT');
    });

    it('should return undefined for unknown asset classes', () => {
      const etf = getEtfForAssetClass('crypto');
      expect(etf).toBeUndefined();
    });
  });
});
