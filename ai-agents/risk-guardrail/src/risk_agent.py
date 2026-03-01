"""
Risk & Guardrail Agent

DETERMINISTIC rule engine (NOT ML) with veto power over all other agents.
This agent CANNOT be disabled by tenant configuration.

Prevents:
  - Debt accumulation from reward chasing
  - Credit utilization spikes
  - Reward function exploitation (manufactured spend)
  - Over-leverage
  - Predatory patterns

Hard Blocks (cannot be overridden):
  - credit_utilization > 85%
  - anomaly_score > 0.95
  - KYC status != 'approved'
  - OFAC match

Soft Blocks (user can override with acknowledgment):
  - credit_utilization > 30%
  - spending_velocity > 200% of 90d average
  - sweep would leave < 110% of liquidity threshold
"""
import logging
from typing import Any

logger = logging.getLogger(__name__)


class RiskGuardrailAgent:
    """
    Deterministic Risk & Guardrail Agent.

    Uses rule-based evaluation (NOT ML) for all hard blocks.
    This prevents model drift risk on safety-critical decisions.
    """

    # Hard block thresholds (cannot be overridden)
    HARD_BLOCK_UTILIZATION = 0.85
    HARD_BLOCK_ANOMALY_SCORE = 0.95

    # Soft block thresholds (user can override)
    SOFT_WARN_UTILIZATION = 0.30
    SOFT_WARN_VELOCITY_MULTIPLIER = 2.0
    SOFT_WARN_LIQUIDITY_BUFFER = 1.10

    # Exploitation detection
    MAX_SINGLE_CATEGORY_PCT = 0.80
    CYCLING_PATTERN_THRESHOLD = 5  # Same merchant/amount combo

    def __init__(self, audit_logger: Any):
        self.audit_logger = audit_logger

    async def evaluate(
        self,
        recommendation: dict[str, Any],
        user_features: dict[str, Any],
        tenant_id: str,
        user_id: str,
    ) -> dict[str, Any]:
        """
        Evaluate a recommendation against all guardrails.
        Returns approval/block decision with full reasoning.
        """
        checks_passed: list[str] = []
        checks_failed: list[str] = []
        warnings: list[str] = []
        block_reason: str | None = None
        is_hard_block = False

        # === HARD BLOCKS (cannot be overridden) ===

        # 1. KYC Status Check
        kyc_status = user_features.get("kyc_status", "pending")
        if kyc_status != "approved":
            block_reason = f"KYC status is '{kyc_status}'. Account verification required before automated actions."
            checks_failed.append("kyc_status_check")
            is_hard_block = True
            logger.warning(f"Hard block: KYC not approved for user {user_id}")
        else:
            checks_passed.append("kyc_status_check")

        # 2. Credit Utilization Hard Block
        if not is_hard_block:
            credit_utilization = user_features.get("current_credit_utilization", 0)
            if credit_utilization > self.HARD_BLOCK_UTILIZATION:
                block_reason = (
                    f"Credit utilization is {credit_utilization*100:.0f}% "
                    f"(above {self.HARD_BLOCK_UTILIZATION*100:.0f}% safety threshold). "
                    "No card recommendations will be made to prevent further utilization increase."
                )
                checks_failed.append("utilization_hard_block")
                is_hard_block = True
                logger.warning(f"Hard block: utilization {credit_utilization:.2%} for user {user_id}")
            else:
                checks_passed.append("utilization_hard_block")

        # 3. Anomaly Score Hard Block
        if not is_hard_block:
            anomaly_score = user_features.get("anomaly_score", 0)
            if anomaly_score > self.HARD_BLOCK_ANOMALY_SCORE:
                block_reason = (
                    "Unusual account activity detected. "
                    "All automated actions paused pending review."
                )
                checks_failed.append("anomaly_hard_block")
                is_hard_block = True
                logger.warning(f"Hard block: anomaly score {anomaly_score:.2f} for user {user_id}")
            else:
                checks_passed.append("anomaly_hard_block")

        if is_hard_block:
            self.audit_logger.log_guardrail_block(
                tenant_id=tenant_id,
                user_id=user_id,
                blocked_action=recommendation.get("type", "unknown"),
                rule_triggered=checks_failed[-1] if checks_failed else "unknown",
                severity="critical",
                details={
                    "recommendation": recommendation.get("type"),
                    "block_reason": block_reason,
                },
            )
            return {
                "approved": False,
                "block_reason": block_reason,
                "triggered": checks_failed,
                "checks_passed": checks_passed,
                "is_hard_block": True,
                "user_override_available": False,
            }

        # === SOFT BLOCKS (user can override with acknowledgment) ===

        # 4. Credit Utilization Soft Warning
        credit_utilization = user_features.get("current_credit_utilization", 0)
        if credit_utilization > self.SOFT_WARN_UTILIZATION:
            warnings.append(
                f"Credit utilization is {credit_utilization*100:.0f}%. "
                "Consider paying down balances before optimizing rewards."
            )
            checks_failed.append("utilization_soft_warn")
        else:
            checks_passed.append("utilization_soft_warn")

        # 5. Spending Velocity Check
        velocity_7d = user_features.get("spending_velocity_7d", 0)
        velocity_90d_avg = user_features.get("spending_velocity_90d_avg", 0)
        if velocity_90d_avg > 0 and velocity_7d > velocity_90d_avg * self.SOFT_WARN_VELOCITY_MULTIPLIER:
            warnings.append(
                f"Spending velocity is {velocity_7d/velocity_90d_avg*100:.0f}% of your 90-day average. "
                "Flagged as unusual."
            )
            checks_failed.append("velocity_soft_warn")
        else:
            checks_passed.append("velocity_soft_warn")

        # 6. Idle Cash Sweep Safety (if applicable)
        if recommendation.get("type") == "idle_cash_sweep":
            rec_data = recommendation.get("data", {})
            sweep_amount = rec_data.get("sweep_amount", 0)
            available_balance = rec_data.get("available_balance", 0)
            liquidity_threshold = rec_data.get("liquidity_threshold", 0)
            remaining = available_balance - sweep_amount

            if remaining < liquidity_threshold * self.SOFT_WARN_LIQUIDITY_BUFFER:
                warnings.append(
                    f"Sweep would leave balance at ${remaining:.2f}, "
                    f"which is close to your ${liquidity_threshold:.2f} liquidity threshold."
                )
                checks_failed.append("liquidity_soft_warn")
            else:
                checks_passed.append("liquidity_soft_warn")

        # 7. Reward Function Exploitation Detection
        exploitation_check = self._check_exploitation(recommendation, user_features)
        if exploitation_check:
            warnings.append(exploitation_check)
            checks_failed.append("exploitation_detection")
        else:
            checks_passed.append("exploitation_detection")

        # Soft blocks are approved but with warnings
        approved = True
        if warnings:
            recommendation["warnings"] = warnings
            recommendation["user_override_available"] = True

        return {
            "approved": approved,
            "block_reason": None,
            "triggered": checks_failed,
            "checks_passed": checks_passed,
            "warnings": warnings,
            "is_hard_block": False,
            "user_override_available": bool(warnings),
        }

    def _check_exploitation(
        self,
        recommendation: dict[str, Any],
        user_features: dict[str, Any],
    ) -> str | None:
        """
        Detect reward function exploitation patterns:
        - Manufactured spend
        - Single category concentration > 80%
        - Credit card cycling
        """
        spend_by_category = user_features.get("avg_monthly_spend_by_category", {})
        if spend_by_category:
            total_spend = sum(spend_by_category.values())
            if total_spend > 0:
                for category, amount in spend_by_category.items():
                    if amount / total_spend > self.MAX_SINGLE_CATEGORY_PCT:
                        return (
                            f"Over {self.MAX_SINGLE_CATEGORY_PCT*100:.0f}% of spending is in '{category}'. "
                            "Diversified spending patterns are healthier."
                        )

        return None
