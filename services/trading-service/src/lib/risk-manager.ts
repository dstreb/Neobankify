/**
 * Risk Management Engine
 *
 * Implements Value-at-Risk (VaR), drawdown limits, position sizing,
 * and concentration limits for trading accounts.
 */

export interface RiskMetrics {
  portfolioVaR: number;
  portfolioVaR95: number;
  portfolioVaR99: number;
  maxDrawdown: number;
  currentDrawdown: number;
  sharpeRatio: number;
  concentrationRisk: ConcentrationRisk[];
  positionLimits: PositionLimit[];
  overallRiskLevel: string;
  warnings: string[];
}

export interface ConcentrationRisk {
  ticker: string;
  weight: number;
  limit: number;
  isExceeded: boolean;
}

export interface PositionLimit {
  ticker: string;
  currentShares: number;
  maxShares: number;
  currentValueUsd: number;
  maxValueUsd: number;
  utilizationPct: number;
}

export interface DrawdownCheck {
  currentDrawdown: number;
  maxAllowedDrawdown: number;
  isBreached: boolean;
  action: string;
}

export interface PositionSizeResult {
  recommendedShares: number;
  recommendedValueUsd: number;
  maxShares: number;
  maxValueUsd: number;
  riskPerShare: number;
  explanation: string;
}

/**
 * Risk configuration per account risk level.
 */
const RISK_CONFIG: Record<string, {
  maxPositionPct: number;
  maxConcentrationPct: number;
  maxDrawdownPct: number;
  varConfidence95Multiplier: number;
  varConfidence99Multiplier: number;
  maxDailyLossPct: number;
  maxOpenOrders: number;
}> = {
  conservative: {
    maxPositionPct: 0.05,
    maxConcentrationPct: 0.10,
    maxDrawdownPct: 0.05,
    varConfidence95Multiplier: 1.645,
    varConfidence99Multiplier: 2.326,
    maxDailyLossPct: 0.02,
    maxOpenOrders: 5,
  },
  moderate: {
    maxPositionPct: 0.10,
    maxConcentrationPct: 0.20,
    maxDrawdownPct: 0.10,
    varConfidence95Multiplier: 1.645,
    varConfidence99Multiplier: 2.326,
    maxDailyLossPct: 0.05,
    maxOpenOrders: 10,
  },
  aggressive: {
    maxPositionPct: 0.20,
    maxConcentrationPct: 0.30,
    maxDrawdownPct: 0.20,
    varConfidence95Multiplier: 1.645,
    varConfidence99Multiplier: 2.326,
    maxDailyLossPct: 0.10,
    maxOpenOrders: 25,
  },
};

/**
 * Calculate parametric Value-at-Risk.
 * Uses normal distribution assumption with given confidence level.
 */
export function calculateVaR(
  portfolioValue: number,
  dailyVolatility: number,
  confidenceMultiplier: number,
  holdingPeriodDays: number = 1,
): number {
  return portfolioValue * dailyVolatility * confidenceMultiplier * Math.sqrt(holdingPeriodDays);
}

/**
 * Calculate current drawdown from peak.
 */
export function calculateDrawdown(currentValue: number, peakValue: number): number {
  if (peakValue <= 0) return 0;
  return Math.max(0, (peakValue - currentValue) / peakValue);
}

/**
 * Check if drawdown limit is breached.
 */
export function checkDrawdownLimit(
  currentValue: number,
  peakValue: number,
  riskLevel: string,
): DrawdownCheck {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.moderate;
  const currentDrawdown = calculateDrawdown(currentValue, peakValue);
  const isBreached = currentDrawdown >= config.maxDrawdownPct;

  let action = 'none';
  if (isBreached) {
    action = 'halt_trading';
  } else if (currentDrawdown >= config.maxDrawdownPct * 0.8) {
    action = 'reduce_exposure';
  } else if (currentDrawdown >= config.maxDrawdownPct * 0.5) {
    action = 'warn';
  }

  return {
    currentDrawdown: Math.round(currentDrawdown * 10000) / 10000,
    maxAllowedDrawdown: config.maxDrawdownPct,
    isBreached,
    action,
  };
}

/**
 * Calculate recommended position size using the Kelly Criterion (half-Kelly for safety).
 * Constrained by maximum position limits.
 */
export function calculatePositionSize(
  portfolioValue: number,
  currentPrice: number,
  expectedReturn: number,
  volatility: number,
  riskLevel: string,
): PositionSizeResult {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.moderate;

  // Half-Kelly: f* = (edge / odds) / 2
  const kellyFraction = volatility > 0
    ? Math.max(0, (expectedReturn / (volatility * volatility)) / 2)
    : 0;

  // Constrain by max position size
  const maxPct = config.maxPositionPct;
  const usedPct = Math.min(kellyFraction, maxPct);

  const maxValueUsd = portfolioValue * maxPct;
  const recommendedValueUsd = Math.round(portfolioValue * usedPct * 100) / 100;
  const maxShares = Math.floor(maxValueUsd / currentPrice);
  const recommendedShares = Math.floor(recommendedValueUsd / currentPrice);
  const riskPerShare = currentPrice * volatility;

  const explanation = [
    `Half-Kelly fraction: ${(kellyFraction * 100).toFixed(2)}%.`,
    `Max position size: ${(maxPct * 100).toFixed(1)}% of portfolio.`,
    `Recommended: ${recommendedShares} shares ($${recommendedValueUsd}).`,
    `Risk per share: $${riskPerShare.toFixed(2)} (1-day volatility).`,
  ].join(' ');

  return {
    recommendedShares,
    recommendedValueUsd,
    maxShares,
    maxValueUsd: Math.round(maxValueUsd * 100) / 100,
    riskPerShare: Math.round(riskPerShare * 100) / 100,
    explanation,
  };
}

/**
 * Check concentration risk across all positions.
 */
export function checkConcentrationRisk(
  positions: Array<{ ticker: string; currentValue: number }>,
  portfolioValue: number,
  riskLevel: string,
): ConcentrationRisk[] {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.moderate;

  return positions.map(pos => {
    const weight = portfolioValue > 0 ? pos.currentValue / portfolioValue : 0;
    return {
      ticker: pos.ticker,
      weight: Math.round(weight * 10000) / 10000,
      limit: config.maxConcentrationPct,
      isExceeded: weight > config.maxConcentrationPct,
    };
  });
}

/**
 * Full risk assessment for a trading account.
 */
export function assessRisk(
  portfolioValue: number,
  peakValue: number,
  dailyVolatility: number,
  positions: Array<{ ticker: string; currentValue: number }>,
  riskLevel: string,
): RiskMetrics {
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.moderate;
  const warnings: string[] = [];

  const portfolioVaR95 = calculateVaR(portfolioValue, dailyVolatility, config.varConfidence95Multiplier);
  const portfolioVaR99 = calculateVaR(portfolioValue, dailyVolatility, config.varConfidence99Multiplier);
  const currentDrawdown = calculateDrawdown(portfolioValue, peakValue);
  const maxDrawdown = config.maxDrawdownPct;

  const concentrationRisk = checkConcentrationRisk(positions, portfolioValue, riskLevel);
  const exceededPositions = concentrationRisk.filter(c => c.isExceeded);

  if (exceededPositions.length > 0) {
    warnings.push(`Concentration limit exceeded for: ${exceededPositions.map(p => p.ticker).join(', ')}`);
  }

  if (currentDrawdown >= maxDrawdown * 0.8) {
    warnings.push(`Drawdown at ${(currentDrawdown * 100).toFixed(1)}% — approaching ${(maxDrawdown * 100).toFixed(0)}% limit`);
  }

  if (portfolioVaR95 > portfolioValue * config.maxDailyLossPct) {
    warnings.push(`Daily VaR (95%) of $${portfolioVaR95.toFixed(2)} exceeds daily loss limit of $${(portfolioValue * config.maxDailyLossPct).toFixed(2)}`);
  }

  // Determine overall risk level
  let overallRiskLevel = 'normal';
  if (currentDrawdown >= maxDrawdown) {
    overallRiskLevel = 'critical';
  } else if (warnings.length >= 2) {
    overallRiskLevel = 'elevated';
  } else if (warnings.length >= 1) {
    overallRiskLevel = 'warning';
  }

  // Sharpe ratio placeholder (would need return history in production)
  const riskFreeRate = 0.03 / 252; // Daily
  const dailyReturn = dailyVolatility * 0.5; // Placeholder
  const sharpeRatio = dailyVolatility > 0
    ? ((dailyReturn - riskFreeRate) / dailyVolatility) * Math.sqrt(252)
    : 0;

  const positionLimits: PositionLimit[] = positions.map(pos => {
    const maxValueUsd = portfolioValue * config.maxPositionPct;
    return {
      ticker: pos.ticker,
      currentShares: 0, // Would be populated from positions
      maxShares: 0,
      currentValueUsd: pos.currentValue,
      maxValueUsd: Math.round(maxValueUsd * 100) / 100,
      utilizationPct: maxValueUsd > 0
        ? Math.round((pos.currentValue / maxValueUsd) * 10000) / 10000
        : 0,
    };
  });

  return {
    portfolioVaR: Math.round(portfolioVaR95 * 100) / 100,
    portfolioVaR95: Math.round(portfolioVaR95 * 100) / 100,
    portfolioVaR99: Math.round(portfolioVaR99 * 100) / 100,
    maxDrawdown,
    currentDrawdown: Math.round(currentDrawdown * 10000) / 10000,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    concentrationRisk,
    positionLimits,
    overallRiskLevel,
    warnings,
  };
}
