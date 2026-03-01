"""
Feature store client for real-time feature retrieval.
Uses Redis for sub-millisecond feature access.
"""
import json
from typing import Any, Optional

import redis


class FeatureStore:
    """
    Redis-backed feature store for AI agent inference.
    Key pattern: feat:{tenant_id}:{user_id}:{feature_name}
    """

    def __init__(self, host: str = "localhost", port: int = 6379, db: int = 1, password: Optional[str] = None):
        self.client = redis.Redis(host=host, port=port, db=db, password=password, decode_responses=True)
        self.default_ttl = 3600  # 1 hour

    def get_feature(self, tenant_id: str, user_id: str, feature_name: str) -> Optional[Any]:
        """Get a single feature value."""
        key = f"feat:{tenant_id}:{user_id}:{feature_name}"
        value = self.client.get(key)
        if value is None:
            return None
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value

    def get_features(self, tenant_id: str, user_id: str, feature_names: list[str]) -> dict[str, Any]:
        """Get multiple features in a single round-trip (MGET)."""
        keys = [f"feat:{tenant_id}:{user_id}:{name}" for name in feature_names]
        values = self.client.mget(keys)

        result = {}
        for name, value in zip(feature_names, values):
            if value is not None:
                try:
                    result[name] = json.loads(value)
                except (json.JSONDecodeError, TypeError):
                    result[name] = value
        return result

    def set_feature(self, tenant_id: str, user_id: str, feature_name: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set a feature value with optional TTL."""
        key = f"feat:{tenant_id}:{user_id}:{feature_name}"
        self.client.set(key, json.dumps(value), ex=ttl or self.default_ttl)

    def set_features(self, tenant_id: str, user_id: str, features: dict[str, Any], ttl: Optional[int] = None) -> None:
        """Set multiple features in a pipeline."""
        pipe = self.client.pipeline()
        for name, value in features.items():
            key = f"feat:{tenant_id}:{user_id}:{name}"
            pipe.set(key, json.dumps(value), ex=ttl or self.default_ttl)
        pipe.execute()

    def get_user_profile_features(self, tenant_id: str, user_id: str) -> dict[str, Any]:
        """Get all standard user profile features needed by agents."""
        feature_names = [
            "avg_monthly_spend_by_category",
            "current_credit_utilization",
            "reward_earn_rate_by_card_category",
            "idle_cash_amount",
            "spending_velocity_7d",
            "anomaly_score",
            "preferred_redemption_type",
            "active_bonus_categories",
            "card_portfolio",
            "linked_accounts_summary",
        ]
        return self.get_features(tenant_id, user_id, feature_names)
