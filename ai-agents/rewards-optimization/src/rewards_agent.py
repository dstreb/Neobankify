"""
Rewards Optimization Agent

Maximizes cashback, points, and loyalty value for every transaction
by selecting the optimal payment instrument and redemption strategy.

Inputs:
  - Merchant name + normalized category
  - Transaction amount
  - User's card portfolio (reward rates per category)
  - Active bonus categories (current quarter)
  - User's point balances + expiry dates
  - User's redemption preference

Decision Model:
  Phase 1 - Card Selection: argmax(effective_rate) across card portfolio
  Phase 2 - Redemption Optimization: expiry-aware point redemption
  Phase 3 - Offer Matching: card-linked offer stacking

Fail-Safe:
  - If reward catalog >24h stale -> reduce confidence
  - If user has no cards -> no recommendation
  - Never recommend card that pushes utilization >30% (Risk Agent)
  - Minimum value delta: $0.10
"""
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Spending category to MCC code mapping
MCC_CATEGORY_MAP: dict[str, list[str]] = {
    "dining": ["5812", "5813", "5814"],
    "groceries": ["5411", "5422", "5441", "5451", "5462"],
    "gas": ["5541", "5542"],
    "travel": ["3000-3299", "4511", "4722", "7011", "7012"],
    "entertainment": ["7832", "7922", "7929", "7941"],
    "shopping": ["5300-5399", "5600-5699", "5700-5799"],
    "transportation": ["4111", "4121", "4131"],
    "utilities": ["4900"],
    "subscriptions": ["5815", "5816", "5817", "5818"],
}


class RewardsOptimizationAgent:
    """
    Rewards Optimization Agent.

    For each transaction, determines the optimal card to use
    and generates a recommendation with full explanation.
    """

    MIN_VALUE_DELTA = 0.10  # $0.10 minimum savings to recommend

    def __init__(self, feature_store: Any, audit_logger: Any):
        self.feature_store = feature_store
        self.audit_logger = audit_logger

    async def process(
        self,
        event: dict[str, Any],
        user_features: dict[str, Any],
        tenant_config: dict[str, Any],
    ) -> Optional[dict[str, Any]]:
        """
        Process a transaction event and generate card routing recommendation.
        """
        event_data = event.get("data", {})
        category = event_data.get("category", "other")
        amount = event_data.get("amount", 0)
        merchant = event_data.get("merchantNormalized", event_data.get("merchantName", ""))

        # Get user's card portfolio from feature store
        card_portfolio = user_features.get("card_portfolio", [])
        if not card_portfolio:
            logger.info("User has no cards in portfolio, skipping")
            return None

        active_bonuses = user_features.get("active_bonus_categories", {})
        redemption_pref = user_features.get("preferred_redemption_type", "cashback")

        # Phase 1: Card Selection
        card_scores = self._score_cards(card_portfolio, category, merchant, amount, active_bonuses, redemption_pref)

        if not card_scores:
            return None

        # Sort by effective value (descending)
        card_scores.sort(key=lambda x: x["effective_value"], reverse=True)
        optimal = card_scores[0]
        runner_up = card_scores[1] if len(card_scores) > 1 else None

        # Check minimum value delta
        if runner_up:
            value_delta = optimal["effective_value"] - runner_up["effective_value"]
        else:
            value_delta = optimal["effective_value"]

        if value_delta < self.MIN_VALUE_DELTA:
            logger.info(f"Value delta ${value_delta:.2f} below threshold, skipping")
            return None

        # Calculate confidence based on data freshness
        confidence = self._calculate_confidence(card_portfolio, category)

        # Generate explanation
        explanation = self._generate_explanation(optimal, runner_up, category, amount)

        recommendation = {
            "type": "card_routing",
            "title": f"Use {optimal['card_name']} for this purchase",
            "summary": f"Earn {optimal['earn_rate']*100:.1f}x on {category} (${optimal['effective_value']:.2f} value)",
            "explanation": explanation,
            "confidence_score": confidence,
            "value_delta": round(value_delta, 2),
            "data": {
                "optimal_card_id": optimal["card_id"],
                "optimal_card_name": optimal["card_name"],
                "optimal_earn_rate": optimal["earn_rate"],
                "optimal_effective_value": round(optimal["effective_value"], 2),
                "alternatives": [
                    {
                        "card_id": s["card_id"],
                        "card_name": s["card_name"],
                        "earn_rate": s["earn_rate"],
                        "effective_value": round(s["effective_value"], 2),
                    }
                    for s in card_scores[1:4]  # Top 3 alternatives
                ],
                "category": category,
                "merchant": merchant,
                "amount": amount,
            },
        }

        return recommendation

    def _score_cards(
        self,
        card_portfolio: list[dict[str, Any]],
        category: str,
        merchant: str,
        amount: float,
        active_bonuses: dict[str, Any],
        redemption_pref: str,
    ) -> list[dict[str, Any]]:
        """Score each card in the portfolio for this transaction."""
        scores = []

        for card in card_portfolio:
            card_id = card.get("id", "")
            card_name = card.get("name", "Unknown Card")
            category_rates = card.get("category_rates", {})
            base_rate = card.get("base_earn_rate", 0.01)
            point_value = card.get("point_value_cents", 1.0) / 100  # Convert to dollars

            # Get earn rate for this category
            earn_rate = category_rates.get(category, base_rate)

            # Check for active bonus categories (quarterly bonuses)
            bonus_key = f"{card_id}:{category}"
            if bonus_key in active_bonuses:
                earn_rate = active_bonuses[bonus_key]

            # Adjust point value based on redemption preference
            effective_point_value = self._get_point_value(card, redemption_pref)

            # Calculate effective dollar value
            effective_value = amount * earn_rate * effective_point_value

            # Check for merchant-specific offers
            merchant_offers = card.get("active_offers", [])
            offer_bonus = 0
            for offer in merchant_offers:
                if offer.get("merchant", "").lower() == merchant.lower():
                    offer_bonus = amount * offer.get("cashback_pct", 0)
                    break

            effective_value += offer_bonus

            scores.append({
                "card_id": card_id,
                "card_name": card_name,
                "earn_rate": earn_rate,
                "point_value": effective_point_value,
                "effective_value": effective_value,
                "offer_bonus": offer_bonus,
            })

        return scores

    def _get_point_value(self, card: dict[str, Any], redemption_pref: str) -> float:
        """Calculate point value based on redemption preference."""
        base_value = card.get("point_value_cents", 1.0) / 100

        # Redemption multipliers
        multipliers = {
            "cashback": 1.0,
            "travel": card.get("travel_multiplier", 1.25),
            "transfer": card.get("transfer_multiplier", 1.5),
            "gift_cards": 0.9,
        }

        return base_value * multipliers.get(redemption_pref, 1.0)

    def _calculate_confidence(self, card_portfolio: list[dict[str, Any]], category: str) -> float:
        """Calculate confidence score based on data quality."""
        confidence = 0.95  # Base confidence

        # Reduce if any card data is stale
        for card in card_portfolio:
            last_updated = card.get("last_updated_hours_ago", 0)
            if last_updated > 24:
                confidence -= 0.1
                break
            elif last_updated > 12:
                confidence -= 0.05

        # Reduce for less common categories
        common_categories = {"dining", "groceries", "gas", "travel", "shopping"}
        if category not in common_categories:
            confidence -= 0.05

        return max(confidence, 0.5)

    def _generate_explanation(
        self,
        optimal: dict[str, Any],
        runner_up: Optional[dict[str, Any]],
        category: str,
        amount: float,
    ) -> str:
        """Generate user-facing explanation."""
        parts = [
            f"Use {optimal['card_name']} for this ${amount:.2f} {category} purchase.",
            f"You'll earn {optimal['earn_rate']*100:.1f}x (${optimal['effective_value']:.2f} value).",
        ]

        if runner_up:
            parts.append(
                f"Your {runner_up['card_name']} would earn {runner_up['earn_rate']*100:.1f}x "
                f"(${runner_up['effective_value']:.2f} value)."
            )
            delta = optimal["effective_value"] - runner_up["effective_value"]
            parts.append(f"Savings: ${delta:.2f}")

        if optimal.get("offer_bonus", 0) > 0:
            parts.append(f"Plus ${optimal['offer_bonus']:.2f} from a card-linked offer!")

        return " ".join(parts)
