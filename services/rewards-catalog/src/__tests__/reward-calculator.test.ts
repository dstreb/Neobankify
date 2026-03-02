import {
  calculateRewards,
  CardPortfolioEntry,
  TransactionContext,
} from '../lib/reward-calculator';

function makeCard(overrides: Partial<CardPortfolioEntry> = {}): CardPortfolioEntry {
  return {
    cardId: 'card-001',
    cardName: 'Chase Freedom Flex',
    programType: 'cashback',
    baseEarnRate: 0.01,
    categoryRates: { dining: 0.03, groceries: 0.05 },
    pointValueCents: 1.0,
    travelMultiplier: 1.25,
    transferMultiplier: 1.5,
    currentBalance: 500,
    creditLimit: 5000,
    activeBonuses: [],
    activeOffers: [],
    ...overrides,
  };
}

function makeTxn(overrides: Partial<TransactionContext> = {}): TransactionContext {
  return {
    transactionId: 'txn-001',
    amount: 50.00,
    category: 'dining',
    subcategory: 'restaurants',
    merchantNormalized: 'STARBUCKS',
    merchantCanonical: 'STARBUCKS',
    cardUsed: null,
    ...overrides,
  };
}

describe('Reward Calculator', () => {
  describe('calculateRewards', () => {
    it('should return empty result for empty portfolio', () => {
      const result = calculateRewards(makeTxn(), []);
      expect(result.optimalCard.cardId).toBe('');
      expect(result.missedValue).toBe(0);
      expect(result.wasOptimal).toBe(true);
    });

    it('should pick the card with highest effective value', () => {
      const cards = [
        makeCard({ cardId: 'card-1', cardName: 'Card A', baseEarnRate: 0.01, categoryRates: {} }),
        makeCard({ cardId: 'card-2', cardName: 'Card B', baseEarnRate: 0.01, categoryRates: { dining: 0.05 } }),
      ];
      const txn = makeTxn({ amount: 100, category: 'dining' });
      const result = calculateRewards(txn, cards);

      expect(result.optimalCard.cardId).toBe('card-2');
      expect(result.optimalCard.earnRate).toBe(0.05);
    });

    it('should calculate correct cashback for cashback program', () => {
      const cards = [
        makeCard({
          cardId: 'card-1',
          programType: 'cashback',
          baseEarnRate: 0.02,
          categoryRates: {},
          pointValueCents: 1.0,
        }),
      ];
      const txn = makeTxn({ amount: 100 });
      const result = calculateRewards(txn, cards);

      // 100 * 0.02 * (1.0/100) = 0.02 effective value
      // But for cashback: pointsEarned=0, cashbackEarned = rawPoints * pointValue
      expect(result.optimalCard.cashbackEarned).toBeGreaterThan(0);
    });

    it('should apply category rates correctly', () => {
      const cards = [
        makeCard({
          cardId: 'card-1',
          baseEarnRate: 0.01,
          categoryRates: { dining: 0.03, groceries: 0.06 },
        }),
      ];

      const diningTxn = makeTxn({ amount: 100, category: 'dining' });
      const groceryTxn = makeTxn({ amount: 100, category: 'groceries' });
      const otherTxn = makeTxn({ amount: 100, category: 'shopping' });

      const diningResult = calculateRewards(diningTxn, cards);
      const groceryResult = calculateRewards(groceryTxn, cards);
      const otherResult = calculateRewards(otherTxn, cards);

      expect(diningResult.optimalCard.earnRate).toBe(0.03);
      expect(groceryResult.optimalCard.earnRate).toBe(0.06);
      expect(otherResult.optimalCard.earnRate).toBe(0.01);
    });

    it('should apply quarterly bonuses over category rates', () => {
      const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
      const cards = [
        makeCard({
          cardId: 'card-1',
          baseEarnRate: 0.01,
          categoryRates: { dining: 0.03 },
          activeBonuses: [
            { category: 'dining', earnRate: 0.05, quarterStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), quarterEnd: futureDate },
          ],
        }),
      ];
      const txn = makeTxn({ amount: 100, category: 'dining' });
      const result = calculateRewards(txn, cards);

      expect(result.optimalCard.earnRate).toBe(0.05);
      expect(result.optimalCard.bonusApplied).toBe(true);
      expect(result.optimalCard.bonusCategory).toBe('dining');
    });

    it('should not apply expired quarterly bonuses', () => {
      const pastDate = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
      const cards = [
        makeCard({
          cardId: 'card-1',
          baseEarnRate: 0.01,
          categoryRates: { dining: 0.03 },
          activeBonuses: [
            { category: 'dining', earnRate: 0.05, quarterStart: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(), quarterEnd: pastDate },
          ],
        }),
      ];
      const txn = makeTxn({ amount: 100, category: 'dining' });
      const result = calculateRewards(txn, cards);

      // Should fall back to category rate since bonus is expired
      expect(result.optimalCard.earnRate).toBe(0.03);
      expect(result.optimalCard.bonusApplied).toBe(false);
    });

    it('should add card-linked offer bonus', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const cards = [
        makeCard({
          cardId: 'card-1',
          baseEarnRate: 0.01,
          categoryRates: {},
          activeOffers: [
            { merchant: 'STARBUCKS', cashbackPct: 0.10, maxCashback: 10.00, expiresAt: futureDate },
          ],
        }),
      ];
      const txn = makeTxn({ amount: 50, merchantCanonical: 'STARBUCKS' });
      const result = calculateRewards(txn, cards);

      expect(result.optimalCard.offerBonus).toBeGreaterThan(0);
      // Offer: 50 * 0.10 = 5.00
      expect(result.optimalCard.offerBonus).toBe(5.00);
    });

    it('should cap offer bonus at maxCashback', () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const cards = [
        makeCard({
          cardId: 'card-1',
          baseEarnRate: 0.01,
          activeOffers: [
            { merchant: 'STARBUCKS', cashbackPct: 0.10, maxCashback: 2.00, expiresAt: futureDate },
          ],
        }),
      ];
      const txn = makeTxn({ amount: 50, merchantCanonical: 'STARBUCKS' });
      const result = calculateRewards(txn, cards);

      expect(result.optimalCard.offerBonus).toBe(2.00);
    });

    it('should exclude cards over utilization threshold', () => {
      const cards = [
        makeCard({
          cardId: 'card-high-util',
          cardName: 'High Util Card',
          currentBalance: 1400,
          creditLimit: 5000, // 1400 + 200 = 1600/5000 = 32% > 30%
          baseEarnRate: 0.05,
          categoryRates: {},
        }),
        makeCard({
          cardId: 'card-low-util',
          cardName: 'Low Util Card',
          currentBalance: 200,
          creditLimit: 5000,
          baseEarnRate: 0.01,
          categoryRates: {},
        }),
      ];
      const txn = makeTxn({ amount: 200 });
      const result = calculateRewards(txn, cards);

      // High-util card should be excluded despite higher earn rate
      expect(result.optimalCard.cardId).toBe('card-low-util');
    });

    it('should calculate missed value when suboptimal card was used', () => {
      const cards = [
        makeCard({ cardId: 'card-best', baseEarnRate: 0.01, categoryRates: { dining: 0.05 } }),
        makeCard({ cardId: 'card-used', baseEarnRate: 0.01, categoryRates: {} }),
      ];
      const txn = makeTxn({ amount: 100, category: 'dining', cardUsed: 'card-used' });
      const result = calculateRewards(txn, cards);

      expect(result.wasOptimal).toBe(false);
      expect(result.missedValue).toBeGreaterThan(0);
      expect(result.optimalCard.cardId).toBe('card-best');
    });

    it('should report wasOptimal=true when the best card was used', () => {
      const cards = [
        makeCard({ cardId: 'card-best', baseEarnRate: 0.01, categoryRates: { dining: 0.05 } }),
        makeCard({ cardId: 'card-other', baseEarnRate: 0.01, categoryRates: {} }),
      ];
      const txn = makeTxn({ amount: 100, category: 'dining', cardUsed: 'card-best' });
      const result = calculateRewards(txn, cards);

      expect(result.wasOptimal).toBe(true);
      expect(result.missedValue).toBe(0);
    });

    it('should generate recommendation when value delta exceeds threshold', () => {
      const cards = [
        makeCard({ cardId: 'card-1', cardName: 'Best Card', baseEarnRate: 0.01, categoryRates: { dining: 0.05 } }),
        makeCard({ cardId: 'card-2', cardName: 'Okay Card', baseEarnRate: 0.01, categoryRates: {} }),
      ];
      // $100 dining: card-1 earns 5%, card-2 earns 1% → delta = $0.04 effective
      // Need high enough amount to generate delta > $0.10
      const txn = makeTxn({ amount: 500, category: 'dining' });
      const result = calculateRewards(txn, cards);

      expect(result.recommendation).not.toBeNull();
      expect(result.recommendation!.type).toBe('card_routing');
      expect(result.recommendation!.data.optimalCardId).toBe('card-1');
    });

    it('should not generate recommendation for small value delta', () => {
      const cards = [
        makeCard({ cardId: 'card-1', baseEarnRate: 0.01, categoryRates: {} }),
        makeCard({ cardId: 'card-2', baseEarnRate: 0.0105, categoryRates: {} }),
      ];
      const txn = makeTxn({ amount: 5 }); // Very small transaction
      const result = calculateRewards(txn, cards);

      // Delta is tiny, should not generate recommendation
      expect(result.recommendation).toBeNull();
    });

    it('should handle travel redemption multiplier', () => {
      const cards = [
        makeCard({
          cardId: 'card-1',
          programType: 'points',
          baseEarnRate: 0.02,
          pointValueCents: 1.0,
          travelMultiplier: 1.5,
        }),
      ];
      const txn = makeTxn({ amount: 100 });

      const cashbackResult = calculateRewards(txn, cards, 'cashback');
      const travelResult = calculateRewards(txn, cards, 'travel');

      expect(travelResult.optimalCard.effectiveValue).toBeGreaterThan(
        cashbackResult.optimalCard.effectiveValue,
      );
    });

    it('should return alternatives sorted by effective value', () => {
      const cards = [
        makeCard({ cardId: 'card-1', baseEarnRate: 0.03, categoryRates: {} }),
        makeCard({ cardId: 'card-2', baseEarnRate: 0.02, categoryRates: {} }),
        makeCard({ cardId: 'card-3', baseEarnRate: 0.01, categoryRates: {} }),
      ];
      const txn = makeTxn({ amount: 100 });
      const result = calculateRewards(txn, cards);

      expect(result.optimalCard.cardId).toBe('card-1');
      expect(result.alternatives.length).toBe(2);
      expect(result.alternatives[0].cardId).toBe('card-2');
      expect(result.alternatives[1].cardId).toBe('card-3');
    });
  });
});
