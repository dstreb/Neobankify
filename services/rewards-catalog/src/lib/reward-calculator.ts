/**
 * Reward Calculator Engine
 *
 * Calculates reward earnings for transactions based on:
 * - Card reward program rates (base + category bonuses)
 * - Active quarterly bonus categories
 * - Card-linked offers (merchant-specific cashback)
 * - Redemption value multipliers
 *
 * Also calculates "missed value" — how much the user could have earned
 * by using the optimal card for each transaction.
 */
import { logger } from '../config/logger';

export interface CardPortfolioEntry {
  cardId: string;
  cardName: string;
  programType: 'cashback' | 'points' | 'miles';
  baseEarnRate: number;          // e.g., 0.01 for 1%
  categoryRates: Record<string, number>; // e.g., { dining: 0.03, groceries: 0.06 }
  pointValueCents: number;       // e.g., 1.0 for $0.01/point
  travelMultiplier: number;      // e.g., 1.25 for 25% bonus on travel redemption
  transferMultiplier: number;    // e.g., 1.5 for transfer partners
  currentBalance: number;
  creditLimit: number;
  activeBonuses: Array<{
    category: string;
    earnRate: number;
    quarterStart: string;
    quarterEnd: string;
  }>;
  activeOffers: Array<{
    merchant: string;
    cashbackPct: number;
    maxCashback: number;
    expiresAt: string;
  }>;
}

export interface TransactionContext {
  transactionId: string;
  amount: number;
  category: string;
  subcategory: string;
  merchantNormalized: string;
  merchantCanonical: string | null;
  cardUsed: string | null; // Card ID actually used for the transaction
}

export interface CardScore {
  cardId: string;
  cardName: string;
  earnRate: number;
  effectiveValue: number;
  pointsEarned: number;
  cashbackEarned: number;
  offerBonus: number;
  bonusApplied: boolean;
  bonusCategory: string | null;
}

export interface RewardCalculation {
  transactionId: string;
  optimalCard: CardScore;
  actualCard: CardScore | null;
  alternatives: CardScore[];
  missedValue: number;
  wasOptimal: boolean;
  valueDelta: number;
  recommendation: RewardRecommendation | null;
}

export interface RewardRecommendation {
  type: 'card_routing';
  title: string;
  summary: string;
  explanation: string;
  confidenceScore: number;
  valueDelta: number;
  data: {
    optimalCardId: string;
    optimalCardName: string;
    optimalEarnRate: number;
    optimalEffectiveValue: number;
    category: string;
    merchant: string;
    amount: number;
    alternatives: Array<{
      cardId: string;
      cardName: string;
      earnRate: number;
      effectiveValue: number;
    }>;
  };
}

const MIN_VALUE_DELTA = 0.10; // $0.10 minimum to generate a recommendation
const MAX_UTILIZATION_THRESHOLD = 0.30; // Don't recommend cards over 30% utilization

/**
 * Calculate rewards for a transaction across the user's card portfolio.
 */
export function calculateRewards(
  txn: TransactionContext,
  portfolio: CardPortfolioEntry[],
  redemptionPreference: string = 'cashback',
): RewardCalculation {
  if (portfolio.length === 0) {
    return {
      transactionId: txn.transactionId,
      optimalCard: createEmptyScore(),
      actualCard: null,
      alternatives: [],
      missedValue: 0,
      wasOptimal: true,
      valueDelta: 0,
      recommendation: null,
    };
  }

  // Score each card (filtered by utilization for recommendations)
  const scores: CardScore[] = portfolio
    .filter((card) => isCardUsable(card, txn.amount))
    .map((card) => scoreCard(card, txn, redemptionPreference));

  // Score the actual card separately (even if filtered out by utilization)
  // so we always record correct earnings for the card the user actually used
  let actualCard: CardScore | null = null;
  if (txn.cardUsed) {
    const actualCardEntry = portfolio.find((c) => c.cardId === txn.cardUsed);
    if (actualCardEntry) {
      // Check if already in scored list
      const inScores = scores.find((s) => s.cardId === txn.cardUsed);
      actualCard = inScores || scoreCard(actualCardEntry, txn, redemptionPreference);
    }
  }

  if (scores.length === 0) {
    return {
      transactionId: txn.transactionId,
      optimalCard: actualCard || createEmptyScore(),
      actualCard,
      alternatives: [],
      missedValue: 0,
      wasOptimal: true,
      valueDelta: 0,
      recommendation: null,
    };
  }

  // Sort by effective value (descending)
  scores.sort((a, b) => b.effectiveValue - a.effectiveValue);

  const optimalCard = scores[0];
  const alternatives = scores.slice(1, 4); // Top 3 alternatives

  // Calculate missed value
  // When cardUsed is null (e.g., Kafka-consumed transactions), missed value is indeterminate — set to 0
  const actualValue = actualCard ? actualCard.effectiveValue : 0;
  const missedValue = txn.cardUsed
    ? Math.max(0, optimalCard.effectiveValue - actualValue)
    : 0;
  const wasOptimal = !txn.cardUsed || txn.cardUsed === optimalCard.cardId;

  // Generate recommendation if value delta is significant
  // When only one card passes utilization filter, there's no alternative to compare against
  // so valueDelta is 0 (no card-routing recommendation needed)
  const valueDelta = alternatives.length > 0
    ? optimalCard.effectiveValue - alternatives[0].effectiveValue
    : 0;

  const recommendation = valueDelta >= MIN_VALUE_DELTA
    ? generateRecommendation(txn, optimalCard, alternatives, valueDelta)
    : null;

  return {
    transactionId: txn.transactionId,
    optimalCard,
    actualCard,
    alternatives,
    missedValue: Math.round(missedValue * 100) / 100,
    wasOptimal,
    valueDelta: Math.round(valueDelta * 100) / 100,
    recommendation,
  };
}

/**
 * Score a single card for a transaction.
 */
function scoreCard(
  card: CardPortfolioEntry,
  txn: TransactionContext,
  redemptionPreference: string,
): CardScore {
  // Determine earn rate: bonus > category > base
  let earnRate = card.baseEarnRate;
  let bonusApplied = false;
  let bonusCategory: string | null = null;

  // Check active quarterly bonuses first (highest priority)
  const now = new Date();
  for (const bonus of card.activeBonuses) {
    if (
      bonus.category === txn.category &&
      new Date(bonus.quarterStart) <= now &&
      new Date(bonus.quarterEnd) > now
    ) {
      earnRate = bonus.earnRate;
      bonusApplied = true;
      bonusCategory = bonus.category;
      break;
    }
  }

  // Check category rates (if no bonus applied)
  if (!bonusApplied && card.categoryRates[txn.category]) {
    earnRate = card.categoryRates[txn.category];
  }

  // Calculate base points/cashback earned
  const rawPointsEarned = txn.amount * earnRate;

  // Calculate point value based on redemption preference
  const pointValue = getPointValue(card, redemptionPreference);

  // Calculate effective dollar value
  let effectiveValue = rawPointsEarned * pointValue;

  // Check for card-linked offers
  let offerBonus = 0;
  const merchant = txn.merchantCanonical || txn.merchantNormalized;
  for (const offer of card.activeOffers) {
    if (
      offer.merchant.toUpperCase() === merchant.toUpperCase() &&
      new Date(offer.expiresAt) > now
    ) {
      const rawBonus = txn.amount * offer.cashbackPct;
      offerBonus = Math.min(rawBonus, offer.maxCashback);
      break;
    }
  }

  effectiveValue += offerBonus;

  // Determine points/cashback based on program type
  const pointsEarned = card.programType === 'cashback'
    ? 0
    : Math.round(rawPointsEarned * 100) / 100;

  const cashbackEarned = card.programType === 'cashback'
    ? Math.round(rawPointsEarned * pointValue * 100) / 100
    : 0;

  return {
    cardId: card.cardId,
    cardName: card.cardName,
    earnRate,
    effectiveValue: Math.round(effectiveValue * 100) / 100,
    pointsEarned,
    cashbackEarned,
    offerBonus: Math.round(offerBonus * 100) / 100,
    bonusApplied,
    bonusCategory,
  };
}

/**
 * Check if a card is usable for a given transaction amount.
 * Respects utilization thresholds set by the Risk Agent.
 */
function isCardUsable(card: CardPortfolioEntry, amount: number): boolean {
  if (card.creditLimit <= 0) return true; // Debit/no-limit card

  const projectedBalance = card.currentBalance + amount;
  const projectedUtilization = projectedBalance / card.creditLimit;

  // Don't recommend if it would push utilization above threshold
  return projectedUtilization <= MAX_UTILIZATION_THRESHOLD;
}

/**
 * Get the effective point value based on redemption preference.
 */
function getPointValue(card: CardPortfolioEntry, preference: string): number {
  const baseValue = card.pointValueCents / 100; // Convert cents to dollars

  const multipliers: Record<string, number> = {
    cashback: 1.0,
    travel: card.travelMultiplier,
    transfer: card.transferMultiplier,
    gift_cards: 0.9,
  };

  return baseValue * (multipliers[preference] || 1.0);
}

/**
 * Generate a user-facing recommendation.
 */
function generateRecommendation(
  txn: TransactionContext,
  optimal: CardScore,
  alternatives: CardScore[],
  valueDelta: number,
): RewardRecommendation {
  const merchant = txn.merchantCanonical || txn.merchantNormalized;

  const explanationParts: string[] = [
    `Use ${optimal.cardName} for this $${txn.amount.toFixed(2)} ${txn.category} purchase at ${merchant}.`,
    `You'll earn ${(optimal.earnRate * 100).toFixed(1)}% ($${optimal.effectiveValue.toFixed(2)} value).`,
  ];

  if (optimal.bonusApplied) {
    explanationParts.push(`This card has an active ${optimal.bonusCategory} bonus this quarter.`);
  }

  if (optimal.offerBonus > 0) {
    explanationParts.push(`Plus $${optimal.offerBonus.toFixed(2)} from a card-linked offer!`);
  }

  if (alternatives.length > 0) {
    const runnerUp = alternatives[0];
    explanationParts.push(
      `Your ${runnerUp.cardName} would earn ${(runnerUp.earnRate * 100).toFixed(1)}% ($${runnerUp.effectiveValue.toFixed(2)} value).`,
    );
    explanationParts.push(`Extra savings: $${valueDelta.toFixed(2)}`);
  }

  return {
    type: 'card_routing',
    title: `Use ${optimal.cardName} for this purchase`,
    summary: `Earn ${(optimal.earnRate * 100).toFixed(1)}% on ${txn.category} ($${optimal.effectiveValue.toFixed(2)} value)`,
    explanation: explanationParts.join(' '),
    confidenceScore: 0.9,
    valueDelta: Math.round(valueDelta * 100) / 100,
    data: {
      optimalCardId: optimal.cardId,
      optimalCardName: optimal.cardName,
      optimalEarnRate: optimal.earnRate,
      optimalEffectiveValue: optimal.effectiveValue,
      category: txn.category,
      merchant,
      amount: txn.amount,
      alternatives: alternatives.map((a) => ({
        cardId: a.cardId,
        cardName: a.cardName,
        earnRate: a.earnRate,
        effectiveValue: a.effectiveValue,
      })),
    },
  };
}

function createEmptyScore(): CardScore {
  return {
    cardId: '',
    cardName: '',
    earnRate: 0,
    effectiveValue: 0,
    pointsEarned: 0,
    cashbackEarned: 0,
    offerBonus: 0,
    bonusApplied: false,
    bonusCategory: null,
  };
}
