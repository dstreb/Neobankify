"""
Behavioral Learning Agent

Learns user spending patterns over time, detects anomalies,
and dynamically adjusts optimization strategies.

Model:
  - Spending profile built from rolling 12 months of transactions
  - Anomaly detection via statistical thresholds (Isolation Forest in production)
  - Preference learning from recommendation acceptance rates
  - Updated weekly (not real-time, to prevent adversarial drift)

Outputs:
  - Updated user spending profile (to feature store)
  - Anomaly score per transaction
  - Preference adjustments for Orchestrator
"""
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


class BehavioralLearningAgent:
    """
    Behavioral Learning Agent.

    Learns from user behavior to improve recommendation quality.
    """

    ANOMALY_THRESHOLD = 0.8
    HIGH_ANOMALY_THRESHOLD = 0.95

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
        Process transaction event: update spending profile, detect anomalies.
        """
        event_data = event.get("data", {})
        tenant_id = event.get("tenantId", "")
        user_id = event.get("userId", "")

        # Calculate anomaly score for this transaction
        anomaly_score = self._calculate_anomaly_score(event_data, user_features)

        # Update feature store with latest anomaly score
        self.feature_store.set_feature(
            tenant_id, user_id, "anomaly_score", anomaly_score, ttl=86400
        )

        # Update spending velocity
        self._update_spending_velocity(tenant_id, user_id, event_data, user_features)

        # Only generate a recommendation if anomaly is significant
        if anomaly_score < self.ANOMALY_THRESHOLD:
            return None

        # Generate anomaly alert
        severity = "high" if anomaly_score > self.HIGH_ANOMALY_THRESHOLD else "medium"
        explanation = self._explain_anomaly(event_data, user_features, anomaly_score)

        recommendation = {
            "type": "spending_alert",
            "title": "Unusual spending detected",
            "summary": explanation,
            "explanation": explanation,
            "confidence_score": min(anomaly_score, 0.95),
            "value_delta": 0,  # Informational, no direct value
            "data": {
                "anomaly_score": round(anomaly_score, 3),
                "severity": severity,
                "transaction_amount": event_data.get("amount", 0),
                "merchant": event_data.get("merchantNormalized", ""),
                "category": event_data.get("category", ""),
                "factors": self._get_anomaly_factors(event_data, user_features),
            },
        }

        return recommendation

    def _calculate_anomaly_score(
        self,
        transaction: dict[str, Any],
        user_features: dict[str, Any],
    ) -> float:
        """
        Calculate anomaly score using statistical thresholds.
        In production, replace with Isolation Forest / LSTM model.
        """
        score = 0.0
        factors = 0

        amount = transaction.get("amount", 0)
        category = transaction.get("category", "other")
        merchant = transaction.get("merchantNormalized", "")

        # Factor 1: Amount vs. category average
        category_stats = user_features.get("avg_monthly_spend_by_category", {})
        if category in category_stats:
            cat_avg = category_stats[category]
            if cat_avg > 0:
                # Z-score approximation
                ratio = amount / (cat_avg / 30)  # Daily avg
                if ratio > 5:
                    score += 0.4
                elif ratio > 3:
                    score += 0.2
                elif ratio > 2:
                    score += 0.1
            factors += 1
        else:
            # New category for this user
            score += 0.15
            factors += 1

        # Factor 2: Spending velocity
        velocity_7d = user_features.get("spending_velocity_7d", 0)
        velocity_90d_avg = user_features.get("spending_velocity_90d_avg", 0)
        if velocity_90d_avg > 0:
            velocity_ratio = velocity_7d / velocity_90d_avg
            if velocity_ratio > 3:
                score += 0.3
            elif velocity_ratio > 2:
                score += 0.15
            factors += 1

        # Factor 3: New merchant
        known_merchants = user_features.get("known_merchants", [])
        if merchant and merchant not in known_merchants:
            score += 0.1
            factors += 1

        # Normalize to [0, 1]
        if factors > 0:
            score = min(score, 1.0)

        return score

    def _update_spending_velocity(
        self,
        tenant_id: str,
        user_id: str,
        transaction: dict[str, Any],
        user_features: dict[str, Any],
    ) -> None:
        """Update spending velocity in feature store."""
        current_velocity = user_features.get("spending_velocity_7d", 0)
        amount = transaction.get("amount", 0)
        updated_velocity = current_velocity + amount

        self.feature_store.set_feature(
            tenant_id, user_id, "spending_velocity_7d", updated_velocity, ttl=604800
        )

    def _explain_anomaly(
        self,
        transaction: dict[str, Any],
        user_features: dict[str, Any],
        anomaly_score: float,
    ) -> str:
        """Generate user-facing anomaly explanation."""
        amount = transaction.get("amount", 0)
        merchant = transaction.get("merchantNormalized", "Unknown")
        category = transaction.get("category", "unknown")

        if anomaly_score > self.HIGH_ANOMALY_THRESHOLD:
            return (
                f"A ${amount:.2f} transaction at {merchant} appears highly unusual "
                f"for your spending patterns. Please verify this is authorized."
            )
        else:
            return (
                f"A ${amount:.2f} {category} transaction at {merchant} "
                f"is higher than your typical spending in this category."
            )

    def _get_anomaly_factors(
        self,
        transaction: dict[str, Any],
        user_features: dict[str, Any],
    ) -> list[str]:
        """List the factors contributing to the anomaly score."""
        factors = []
        amount = transaction.get("amount", 0)
        category = transaction.get("category", "other")
        merchant = transaction.get("merchantNormalized", "")

        category_stats = user_features.get("avg_monthly_spend_by_category", {})
        if category in category_stats:
            cat_avg = category_stats[category]
            if cat_avg > 0 and amount > (cat_avg / 30) * 2:
                factors.append(f"Amount is {amount/(cat_avg/30):.1f}x your daily average for {category}")
        else:
            factors.append(f"First transaction in '{category}' category")

        known_merchants = user_features.get("known_merchants", [])
        if merchant and merchant not in known_merchants:
            factors.append(f"First transaction at {merchant}")

        velocity_7d = user_features.get("spending_velocity_7d", 0)
        velocity_90d_avg = user_features.get("spending_velocity_90d_avg", 0)
        if velocity_90d_avg > 0 and velocity_7d > velocity_90d_avg * 2:
            factors.append(f"Weekly spending is {velocity_7d/velocity_90d_avg:.1f}x your normal")

        return factors
