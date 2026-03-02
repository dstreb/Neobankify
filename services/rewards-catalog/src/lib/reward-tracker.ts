/**
 * Reward Tracker
 *
 * Tracks earned rewards for each transaction and calculates missed value.
 * Persists reward records to the `rewards_earned` table and generates
 * agent decisions for the audit trail.
 */
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';
import {
  calculateRewards,
  CardPortfolioEntry,
  TransactionContext,
  RewardCalculation,
} from './reward-calculator';

export interface TrackingResult {
  rewardEarnedId: string;
  agentDecisionId: string | null;
  pointsEarned: number;
  cashbackEarned: number;
  wasOptimal: boolean;
  missedValue: number;
}

/**
 * Track rewards for a single enriched transaction.
 * Called after enrichment is complete and category is known.
 */
export async function trackTransactionReward(params: {
  transactionId: string;
  userId: string;
  tenantId: string;
  amount: number;
  category: string;
  subcategory: string;
  merchantNormalized: string;
  merchantCanonical: string | null;
  cardUsed: string | null;
  redemptionPreference?: string;
}): Promise<TrackingResult | null> {
  // Get user's card portfolio with active bonuses and offers
  const portfolio = await getUserCardPortfolio(params.userId, params.tenantId);

  if (portfolio.length === 0) {
    logger.debug('No cards in portfolio, skipping reward tracking', {
      userId: params.userId,
    });
    return null;
  }

  const txnContext: TransactionContext = {
    transactionId: params.transactionId,
    amount: params.amount,
    category: params.category,
    subcategory: params.subcategory,
    merchantNormalized: params.merchantNormalized,
    merchantCanonical: params.merchantCanonical,
    cardUsed: params.cardUsed,
  };

  // Calculate rewards across portfolio
  const calculation = calculateRewards(
    txnContext,
    portfolio,
    params.redemptionPreference || 'cashback',
  );

  // Persist reward earned record
  const rewardEarnedId = uuidv4();
  await db('rewards_earned').insert({
    id: rewardEarnedId,
    user_id: params.userId,
    tenant_id: params.tenantId,
    transaction_id: params.transactionId,
    card_id: params.cardUsed,
    reward_program_id: null, // Can be linked later
    points_earned: (calculation.actualCard || calculation.optimalCard).pointsEarned,
    cashback_earned: (calculation.actualCard || calculation.optimalCard).cashbackEarned,
    earn_rate: (calculation.actualCard || calculation.optimalCard).earnRate,
    was_optimal: calculation.wasOptimal,
    optimal_card_id: calculation.optimalCard.cardId || null,
    missed_value: calculation.missedValue,
    agent_decision_id: null, // Will be updated if recommendation is created
    created_at: new Date(),
  });

  // If there's a recommendation, create an agent decision
  let agentDecisionId: string | null = null;
  if (calculation.recommendation) {
    agentDecisionId = uuidv4();

    await db('agent_decisions').insert({
      id: agentDecisionId,
      tenant_id: params.tenantId,
      user_id: params.userId,
      agent_type: 'rewards_optimization',
      decision_type: calculation.recommendation.type,
      decision: {
        action: calculation.recommendation.title,
        optimalCardId: calculation.recommendation.data.optimalCardId,
        optimalCardName: calculation.recommendation.data.optimalCardName,
        optimalEarnRate: calculation.recommendation.data.optimalEarnRate,
        optimalEffectiveValue: calculation.recommendation.data.optimalEffectiveValue,
        pointsEarned: calculation.optimalCard.pointsEarned,
        cashbackEarned: calculation.optimalCard.cashbackEarned,
        missedValue: calculation.missedValue,
      },
      reasoning: calculation.recommendation.explanation,
      confidence_score: calculation.recommendation.confidenceScore,
      input_features: [
        `category:${params.category}`,
        `amount:${params.amount}`,
        `merchant:${params.merchantNormalized}`,
        `cards:${portfolio.length}`,
      ],
      guardrails_checked: ['credit_utilization', 'min_value_delta'],
      guardrails_triggered: [],
      outcome: 'recommended',
      correlation_id: uuidv4(),
      latency_ms: 0, // Not measured here
      created_at: new Date(),
    });

    // Link the agent decision to the reward record
    await db('rewards_earned')
      .where({ id: rewardEarnedId })
      .update({ agent_decision_id: agentDecisionId });

    // Also create a user-facing recommendation
    await db('recommendations').insert({
      id: uuidv4(),
      user_id: params.userId,
      agent_decision_id: agentDecisionId,
      type: calculation.recommendation.type,
      title: calculation.recommendation.title,
      summary: calculation.recommendation.summary,
      explanation: calculation.recommendation.explanation,
      confidence_score: calculation.recommendation.confidenceScore,
      value_delta: calculation.recommendation.valueDelta,
      data: calculation.recommendation.data,
      status: 'recommended',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      created_at: new Date(),
    });
  }

  // Update the transaction's enrichment_data with reward info
  const txn = await db('transactions')
    .where({ id: params.transactionId, tenant_id: params.tenantId })
    .first();

  if (txn) {
    const existingEnrichment = typeof txn.enrichment_data === 'string'
      ? JSON.parse(txn.enrichment_data)
      : txn.enrichment_data || {};

    const earningsSource = calculation.actualCard || calculation.optimalCard;
    const updatedEnrichment = {
      ...existingEnrichment,
      pointsEarned: earningsSource.pointsEarned,
      cashbackEarned: earningsSource.cashbackEarned,
      wasOptimal: calculation.wasOptimal,
      missedValue: calculation.missedValue,
      optimalCardId: calculation.optimalCard.cardId,
      optimalCardName: calculation.optimalCard.cardName,
    };

    await db('transactions')
      .where({ id: params.transactionId, tenant_id: params.tenantId })
      .update({
        enrichment_data: JSON.stringify(updatedEnrichment),
        updated_at: new Date(),
      });
  }

  logger.info('Reward tracked', {
    transactionId: params.transactionId,
    userId: params.userId,
    pointsEarned: (calculation.actualCard || calculation.optimalCard).pointsEarned,
    cashbackEarned: (calculation.actualCard || calculation.optimalCard).cashbackEarned,
    wasOptimal: calculation.wasOptimal,
    missedValue: calculation.missedValue,
    hasRecommendation: agentDecisionId !== null,
  });

  return {
    rewardEarnedId,
    agentDecisionId,
    pointsEarned: (calculation.actualCard || calculation.optimalCard).pointsEarned,
    cashbackEarned: (calculation.actualCard || calculation.optimalCard).cashbackEarned,
    wasOptimal: calculation.wasOptimal,
    missedValue: calculation.missedValue,
  };
}

/**
 * Get the user's full card portfolio with bonus categories and offers.
 */
async function getUserCardPortfolio(
  userId: string,
  tenantId: string,
): Promise<CardPortfolioEntry[]> {
  // Fetch user's active cards with reward programs
  const cards = await db('user_cards')
    .where({ 'user_cards.user_id': userId, 'user_cards.status': 'active' })
    .leftJoin('reward_programs', 'user_cards.reward_program_id', 'reward_programs.id')
    .select(
      'user_cards.id as card_id',
      'user_cards.card_name',
      'user_cards.current_balance',
      'user_cards.credit_limit',
      'reward_programs.program_type',
      'reward_programs.base_earn_rate',
      'reward_programs.category_rates',
      'reward_programs.point_value_cents',
    );

  const now = new Date();
  const portfolio: CardPortfolioEntry[] = [];

  for (const card of cards) {
    // Fetch active quarterly bonuses for this card
    const bonuses = await db('quarterly_bonuses')
      .where({ card_id: card.card_id, tenant_id: tenantId })
      .where('quarter_end', '>', now)
      .select('category', 'earn_rate', 'quarter_end');

    // Fetch active card-linked offers for this card
    const offers = await db('card_linked_offers')
      .where({ card_id: card.card_id, tenant_id: tenantId, status: 'active' })
      .where('expires_at', '>', now)
      .select('merchant_name', 'cashback_pct', 'max_cashback', 'expires_at');

    const categoryRates = typeof card.category_rates === 'string'
      ? JSON.parse(card.category_rates)
      : card.category_rates || {};

    portfolio.push({
      cardId: card.card_id,
      cardName: card.card_name,
      programType: card.program_type || 'cashback',
      baseEarnRate: parseFloat(card.base_earn_rate) || 0.01,
      categoryRates,
      pointValueCents: parseFloat(card.point_value_cents) || 1.0,
      travelMultiplier: 1.25, // Default, could be stored per program
      transferMultiplier: 1.5,
      currentBalance: parseFloat(card.current_balance) || 0,
      creditLimit: parseFloat(card.credit_limit) || 0,
      activeBonuses: bonuses.map((b: { category: string; earn_rate: string; quarter_end: string }) => ({
        category: b.category,
        earnRate: parseFloat(b.earn_rate),
        quarterEnd: b.quarter_end,
      })),
      activeOffers: offers.map((o: { merchant_name: string; cashback_pct: string; max_cashback: string; expires_at: string }) => ({
        merchant: o.merchant_name,
        cashbackPct: parseFloat(o.cashback_pct),
        maxCashback: parseFloat(o.max_cashback),
        expiresAt: o.expires_at,
      })),
    });
  }

  return portfolio;
}
