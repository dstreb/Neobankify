/**
 * Suitability Assessment Engine
 *
 * Evaluates investor suitability based on SEC/FINRA guidelines.
 * Produces a risk score (0-100) and recommended portfolio strategy.
 * All decisions are auditable and explainable.
 */

export interface SuitabilityInput {
  riskTolerance: string;
  investmentHorizon: string;
  annualIncomeRange: string;
  netWorthRange: string;
  investmentExperience: string;
  investmentObjective: string;
  liquidityNeeds: string;
  isAccreditedInvestor: boolean;
}

export interface SuitabilityResult {
  riskScore: number;
  riskLevel: string;
  recommendedStrategy: string;
  recommendedAllocation: Record<string, number>;
  explanation: string;
  warnings: string[];
}

const RISK_TOLERANCE_SCORES: Record<string, number> = {
  conservative: 10,
  moderate_conservative: 25,
  moderate: 50,
  moderate_aggressive: 75,
  aggressive: 90,
};

const HORIZON_SCORES: Record<string, number> = {
  short_term: 15,
  medium_term: 40,
  long_term: 70,
  retirement: 85,
};

const INCOME_SCORES: Record<string, number> = {
  under_25k: 10,
  '25k_50k': 25,
  '50k_100k': 45,
  '100k_250k': 65,
  '250k_500k': 80,
  over_500k: 90,
};

const NET_WORTH_SCORES: Record<string, number> = {
  under_25k: 10,
  '25k_100k': 25,
  '100k_500k': 45,
  '500k_1m': 65,
  '1m_5m': 80,
  over_5m: 95,
};

const EXPERIENCE_SCORES: Record<string, number> = {
  none: 10,
  limited: 30,
  moderate: 60,
  extensive: 85,
};

const OBJECTIVE_SCORES: Record<string, number> = {
  capital_preservation: 10,
  income: 25,
  growth_income: 50,
  growth: 75,
  aggressive_growth: 95,
};

const LIQUIDITY_PENALTY: Record<string, number> = {
  low: 0,
  moderate: -5,
  high: -15,
};

/**
 * Calculate composite risk score from suitability inputs.
 * Weighted formula based on FINRA suitability guidelines.
 */
export function calculateRiskScore(input: SuitabilityInput): number {
  const weights = {
    riskTolerance: 0.25,
    investmentHorizon: 0.20,
    investmentObjective: 0.20,
    investmentExperience: 0.15,
    netWorth: 0.10,
    income: 0.10,
  };

  const raw =
    (RISK_TOLERANCE_SCORES[input.riskTolerance] || 50) * weights.riskTolerance +
    (HORIZON_SCORES[input.investmentHorizon] || 50) * weights.investmentHorizon +
    (OBJECTIVE_SCORES[input.investmentObjective] || 50) * weights.investmentObjective +
    (EXPERIENCE_SCORES[input.investmentExperience] || 50) * weights.investmentExperience +
    (NET_WORTH_SCORES[input.netWorthRange] || 50) * weights.netWorth +
    (INCOME_SCORES[input.annualIncomeRange] || 50) * weights.income +
    (LIQUIDITY_PENALTY[input.liquidityNeeds] || 0);

  return Math.max(0, Math.min(100, Math.round(raw * 100) / 100));
}

/**
 * Map risk score to risk level bucket.
 */
export function getRiskLevel(score: number): string {
  if (score <= 20) return 'conservative';
  if (score <= 40) return 'moderate_conservative';
  if (score <= 60) return 'moderate';
  if (score <= 80) return 'moderate_aggressive';
  return 'aggressive';
}

/**
 * Get recommended strategy based on risk level and objective.
 */
export function getRecommendedStrategy(riskLevel: string, objective: string): string {
  if (objective === 'capital_preservation') return 'passive_index';
  if (objective === 'income') return 'dividend_income';

  const strategyMap: Record<string, string> = {
    conservative: 'passive_index',
    moderate_conservative: 'balanced',
    moderate: 'balanced',
    moderate_aggressive: 'growth',
    aggressive: 'growth',
  };

  return strategyMap[riskLevel] || 'balanced';
}

/**
 * Model portfolio allocations by risk level.
 * Based on Modern Portfolio Theory with age/risk adjustments.
 */
const MODEL_ALLOCATIONS: Record<string, Record<string, number>> = {
  conservative: {
    us_bonds: 0.50,
    us_large_cap: 0.20,
    international_developed: 0.10,
    short_term_treasury: 0.15,
    tips: 0.05,
  },
  moderate_conservative: {
    us_bonds: 0.35,
    us_large_cap: 0.30,
    international_developed: 0.15,
    us_mid_cap: 0.10,
    short_term_treasury: 0.10,
  },
  moderate: {
    us_large_cap: 0.35,
    us_bonds: 0.25,
    international_developed: 0.15,
    us_mid_cap: 0.10,
    emerging_markets: 0.05,
    reits: 0.05,
    short_term_treasury: 0.05,
  },
  moderate_aggressive: {
    us_large_cap: 0.40,
    international_developed: 0.15,
    us_mid_cap: 0.15,
    us_bonds: 0.10,
    emerging_markets: 0.10,
    us_small_cap: 0.05,
    reits: 0.05,
  },
  aggressive: {
    us_large_cap: 0.35,
    us_mid_cap: 0.15,
    us_small_cap: 0.10,
    international_developed: 0.15,
    emerging_markets: 0.15,
    reits: 0.05,
    us_bonds: 0.05,
  },
};

/**
 * Full suitability assessment.
 * Returns risk score, level, strategy, allocation, and explanation.
 */
export function assessSuitability(input: SuitabilityInput): SuitabilityResult {
  const riskScore = calculateRiskScore(input);
  const riskLevel = getRiskLevel(riskScore);
  const recommendedStrategy = getRecommendedStrategy(riskLevel, input.investmentObjective);
  const recommendedAllocation = MODEL_ALLOCATIONS[riskLevel] || MODEL_ALLOCATIONS.moderate;

  const warnings: string[] = [];

  // Guardrail: aggressive allocation with low income/net worth
  if (riskLevel === 'aggressive' && ['under_25k', '25k_50k'].includes(input.annualIncomeRange)) {
    warnings.push('Aggressive allocation may not be suitable given current income level. Consider a more conservative approach.');
  }

  // Guardrail: short horizon with aggressive allocation
  if (input.investmentHorizon === 'short_term' && ['moderate_aggressive', 'aggressive'].includes(riskLevel)) {
    warnings.push('Short investment horizon with aggressive allocation increases risk of loss. Consider extending timeline or reducing risk.');
  }

  // Guardrail: no experience with aggressive objective
  if (input.investmentExperience === 'none' && input.investmentObjective === 'aggressive_growth') {
    warnings.push('Aggressive growth objective may not be suitable for investors with no prior experience.');
  }

  // Guardrail: high liquidity needs with illiquid allocations
  if (input.liquidityNeeds === 'high' && (recommendedAllocation.reits || 0) > 0.05) {
    warnings.push('High liquidity needs may conflict with REIT and alternative allocations.');
  }

  const explanation = [
    `Risk score: ${riskScore}/100 (${riskLevel}).`,
    `Based on: ${input.riskTolerance} risk tolerance, ${input.investmentHorizon} horizon, ${input.investmentObjective} objective.`,
    `Recommended strategy: ${recommendedStrategy} with ${Object.keys(recommendedAllocation).length} asset classes.`,
    `Equity allocation: ${((recommendedAllocation.us_large_cap || 0) + (recommendedAllocation.us_mid_cap || 0) + (recommendedAllocation.us_small_cap || 0) + (recommendedAllocation.international_developed || 0) + (recommendedAllocation.emerging_markets || 0)) * 100}%.`,
    warnings.length > 0 ? `Warnings: ${warnings.join(' ')}` : 'No suitability warnings.',
  ].join(' ');

  return {
    riskScore,
    riskLevel,
    recommendedStrategy,
    recommendedAllocation,
    explanation,
    warnings,
  };
}
