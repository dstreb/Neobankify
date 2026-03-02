/**
 * Portfolio Construction Engine
 *
 * Builds and manages investment portfolios based on suitability assessment.
 * Implements Modern Portfolio Theory with practical constraints.
 */

export interface AssetAllocation {
  assetClass: string;
  targetWeight: number;
  currentWeight: number;
  etfTicker: string;
  etfName: string;
}

export interface PortfolioConstruction {
  allocations: AssetAllocation[];
  totalInvestment: number;
  expectedReturn: number;
  expectedRisk: number;
  sharpeRatio: number;
  rebalanceThreshold: number;
}

export interface RebalanceAction {
  assetClass: string;
  etfTicker: string;
  action: 'buy' | 'sell';
  targetWeight: number;
  currentWeight: number;
  drift: number;
  amountUsd: number;
  shares: number;
}

export interface TaxLossHarvestOpportunity {
  assetClass: string;
  currentTicker: string;
  replacementTicker: string;
  unrealizedLoss: number;
  estimatedTaxSavings: number;
  washSaleRisk: boolean;
}

/**
 * ETF universe mapped by asset class.
 * Primary and secondary tickers for tax-loss harvesting pairs.
 */
const ETF_UNIVERSE: Record<string, { primary: { ticker: string; name: string }; secondary: { ticker: string; name: string }; expectedReturn: number; expectedVolatility: number }> = {
  us_large_cap: {
    primary: { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF' },
    secondary: { ticker: 'ITOT', name: 'iShares Core S&P Total US Stock Market ETF' },
    expectedReturn: 0.10,
    expectedVolatility: 0.15,
  },
  us_mid_cap: {
    primary: { ticker: 'VO', name: 'Vanguard Mid-Cap ETF' },
    secondary: { ticker: 'IJH', name: 'iShares Core S&P Mid-Cap ETF' },
    expectedReturn: 0.105,
    expectedVolatility: 0.17,
  },
  us_small_cap: {
    primary: { ticker: 'VB', name: 'Vanguard Small-Cap ETF' },
    secondary: { ticker: 'IJR', name: 'iShares Core S&P Small-Cap ETF' },
    expectedReturn: 0.11,
    expectedVolatility: 0.20,
  },
  international_developed: {
    primary: { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF' },
    secondary: { ticker: 'IXUS', name: 'iShares Core MSCI Total International Stock ETF' },
    expectedReturn: 0.08,
    expectedVolatility: 0.16,
  },
  emerging_markets: {
    primary: { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF' },
    secondary: { ticker: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF' },
    expectedReturn: 0.09,
    expectedVolatility: 0.22,
  },
  us_bonds: {
    primary: { ticker: 'BND', name: 'Vanguard Total Bond Market ETF' },
    secondary: { ticker: 'AGG', name: 'iShares Core US Aggregate Bond ETF' },
    expectedReturn: 0.04,
    expectedVolatility: 0.05,
  },
  short_term_treasury: {
    primary: { ticker: 'VGSH', name: 'Vanguard Short-Term Treasury ETF' },
    secondary: { ticker: 'SHV', name: 'iShares Short Treasury Bond ETF' },
    expectedReturn: 0.035,
    expectedVolatility: 0.02,
  },
  tips: {
    primary: { ticker: 'VTIP', name: 'Vanguard Short-Term Inflation-Protected Securities ETF' },
    secondary: { ticker: 'STIP', name: 'iShares 0-5 Year TIPS Bond ETF' },
    expectedReturn: 0.035,
    expectedVolatility: 0.04,
  },
  reits: {
    primary: { ticker: 'VNQ', name: 'Vanguard Real Estate ETF' },
    secondary: { ticker: 'SCHH', name: 'Schwab US REIT ETF' },
    expectedReturn: 0.085,
    expectedVolatility: 0.18,
  },
};

/**
 * Construct a portfolio from the recommended allocation.
 */
export function constructPortfolio(
  targetAllocation: Record<string, number>,
  totalInvestment: number,
): PortfolioConstruction {
  const allocations: AssetAllocation[] = [];
  let expectedReturn = 0;
  let expectedVariance = 0;

  for (const [assetClass, weight] of Object.entries(targetAllocation)) {
    const etfInfo = ETF_UNIVERSE[assetClass];
    if (!etfInfo) continue;

    allocations.push({
      assetClass,
      targetWeight: weight,
      currentWeight: weight, // Initial construction = target
      etfTicker: etfInfo.primary.ticker,
      etfName: etfInfo.primary.name,
    });

    expectedReturn += weight * etfInfo.expectedReturn;
    expectedVariance += weight * weight * etfInfo.expectedVolatility * etfInfo.expectedVolatility;
  }

  const expectedRisk = Math.sqrt(expectedVariance);
  const riskFreeRate = 0.03;
  const sharpeRatio = expectedRisk > 0 ? (expectedReturn - riskFreeRate) / expectedRisk : 0;

  return {
    allocations,
    totalInvestment,
    expectedReturn: Math.round(expectedReturn * 10000) / 10000,
    expectedRisk: Math.round(expectedRisk * 10000) / 10000,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    rebalanceThreshold: 0.05, // 5% drift threshold
  };
}

/**
 * Calculate rebalance actions when portfolio drifts from target.
 */
export function calculateRebalanceActions(
  allocations: AssetAllocation[],
  totalValue: number,
  prices: Record<string, number>,
): RebalanceAction[] {
  const actions: RebalanceAction[] = [];

  for (const alloc of allocations) {
    const drift = alloc.currentWeight - alloc.targetWeight;
    const absDrift = Math.abs(drift);

    if (absDrift < 0.01) continue; // Skip tiny drifts (<1%)

    const amountUsd = Math.abs(drift) * totalValue;
    const price = prices[alloc.etfTicker] || 100;
    const shares = Math.floor(amountUsd / price);

    if (shares === 0) continue;

    actions.push({
      assetClass: alloc.assetClass,
      etfTicker: alloc.etfTicker,
      action: drift > 0 ? 'sell' : 'buy',
      targetWeight: alloc.targetWeight,
      currentWeight: alloc.currentWeight,
      drift: Math.round(drift * 10000) / 10000,
      amountUsd: Math.round(amountUsd * 100) / 100,
      shares,
    });
  }

  // Sort: sells first (to free cash), then buys
  return actions.sort((a, b) => {
    if (a.action === 'sell' && b.action === 'buy') return -1;
    if (a.action === 'buy' && b.action === 'sell') return 1;
    return Math.abs(b.drift) - Math.abs(a.drift);
  });
}

/**
 * Identify tax-loss harvesting opportunities.
 * Swaps underperforming ETFs for correlated alternatives to realize losses.
 */
export function findTaxLossHarvestingOpportunities(
  holdings: Array<{ assetClass: string; ticker: string; costBasis: number; currentValue: number; holdingDays: number }>,
  taxRate: number,
): TaxLossHarvestOpportunity[] {
  const opportunities: TaxLossHarvestOpportunity[] = [];

  for (const holding of holdings) {
    const unrealizedLoss = holding.costBasis - holding.currentValue;

    // Only harvest if there's a meaningful loss (>$50)
    if (unrealizedLoss <= 50) continue;

    const etfInfo = ETF_UNIVERSE[holding.assetClass];
    if (!etfInfo) continue;

    // Determine replacement ticker (swap primary <-> secondary)
    const isPrimary = holding.ticker === etfInfo.primary.ticker;
    const replacementTicker = isPrimary ? etfInfo.secondary.ticker : etfInfo.primary.ticker;

    // Wash sale risk: if holding period < 30 days
    const washSaleRisk = holding.holdingDays < 30;

    opportunities.push({
      assetClass: holding.assetClass,
      currentTicker: holding.ticker,
      replacementTicker,
      unrealizedLoss: Math.round(unrealizedLoss * 100) / 100,
      estimatedTaxSavings: Math.round(unrealizedLoss * taxRate * 100) / 100,
      washSaleRisk,
    });
  }

  // Sort by largest tax savings first
  return opportunities.sort((a, b) => b.estimatedTaxSavings - a.estimatedTaxSavings);
}

/**
 * Get the ETF universe for a given asset class.
 */
export function getEtfForAssetClass(assetClass: string): { primary: { ticker: string; name: string }; secondary: { ticker: string; name: string } } | undefined {
  const etf = ETF_UNIVERSE[assetClass];
  if (!etf) return undefined;
  return { primary: etf.primary, secondary: etf.secondary };
}
