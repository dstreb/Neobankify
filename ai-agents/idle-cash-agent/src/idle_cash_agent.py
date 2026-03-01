"""
Idle Cash Agent

Identifies unproductive capital sitting in low-yield accounts
and routes it to the highest-yield compliant vehicle.

Safety rules:
  - NEVER sweep below user-defined liquidity threshold
  - NEVER exceed FDIC insurance limits per institution ($250K)
  - NEVER recommend vehicles outside tenant-approved list
  - If balance data >4h stale -> do not auto-execute
  - Always maintain 7-day pending transaction buffer
"""
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)

FDIC_LIMIT = 250_000  # Per institution, per depositor


class IdleCashAgent:
    """
    Idle Cash Agent.

    Analyzes user balances and recommends sweeping excess cash
    to higher-yield vehicles while maintaining safety constraints.
    """

    DEFAULT_SWEEP_MINIMUM = 500  # Don't sweep less than $500
    PENDING_BUFFER_DAYS = 7
    STALE_DATA_HOURS = 4

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
        Analyze user's cash positions and generate sweep recommendation.
        """
        accounts_summary = user_features.get("linked_accounts_summary", [])
        if not accounts_summary:
            return None

        # Get user's liquidity threshold (from preferences or tenant default)
        liquidity_threshold = user_features.get(
            "liquidity_threshold",
            tenant_config.get("config", {}).get("defaultLiquidityThreshold", 1000),
        )

        # Get tenant-approved yield vehicles
        approved_vehicles = tenant_config.get("config", {}).get(
            "allowedYieldVehicles", ["hysa"]
        )

        total_idle = 0
        sweep_opportunities: list[dict[str, Any]] = []

        for account in accounts_summary:
            if account.get("account_type") not in ("checking", "savings"):
                continue

            balance = account.get("available_balance", 0)
            pending_avg = account.get("pending_7d_avg", 0)
            data_age_hours = account.get("data_age_hours", 0)
            institution = account.get("institution_name", "")

            # Calculate sweepable amount
            available = balance - liquidity_threshold - pending_avg
            if available < self.DEFAULT_SWEEP_MINIMUM:
                continue

            # Check data freshness
            is_stale = data_age_hours > self.STALE_DATA_HOURS

            total_idle += available

            sweep_opportunities.append({
                "account_id": account.get("id"),
                "institution": institution,
                "available_balance": balance,
                "sweepable_amount": available,
                "is_stale": is_stale,
            })

        if not sweep_opportunities:
            return None

        # Find optimal yield vehicle
        yield_vehicles = self._get_available_vehicles(approved_vehicles)
        if not yield_vehicles:
            logger.warning("No yield vehicles available")
            return None

        # Select best vehicle
        optimal_vehicle = max(yield_vehicles, key=lambda v: v["apy"])

        # Check FDIC limits
        fdic_remaining = self._calculate_fdic_headroom(
            user_features, optimal_vehicle.get("institution", "")
        )

        # Cap sweep at FDIC limit
        sweep_amount = min(total_idle, fdic_remaining)
        if sweep_amount < self.DEFAULT_SWEEP_MINIMUM:
            return None

        # Calculate projected yield improvement
        current_apy = 0.01  # Assume checking account at ~0.01%
        new_apy = optimal_vehicle["apy"]
        annual_improvement = sweep_amount * (new_apy - current_apy)

        # Determine if auto-execute or recommend
        auto_sweep = user_features.get("auto_sweep_enabled", False)
        any_stale = any(s["is_stale"] for s in sweep_opportunities)

        # Never auto-execute with stale data
        can_auto_execute = auto_sweep and not any_stale

        confidence = 0.92 if not any_stale else 0.75

        explanation = self._generate_explanation(
            sweep_amount, optimal_vehicle, annual_improvement, any_stale
        )

        recommendation = {
            "type": "idle_cash_sweep",
            "title": f"Move ${sweep_amount:,.2f} to earn {new_apy*100:.2f}% APY",
            "summary": f"Projected additional yield: ${annual_improvement:,.2f}/year",
            "explanation": explanation,
            "confidence_score": confidence,
            "value_delta": round(annual_improvement, 2),
            "auto_execute": can_auto_execute,
            "data": {
                "sweep_amount": round(sweep_amount, 2),
                "vehicle_type": optimal_vehicle["type"],
                "vehicle_provider": optimal_vehicle.get("provider", ""),
                "vehicle_apy": optimal_vehicle["apy"],
                "available_balance": sum(s["available_balance"] for s in sweep_opportunities),
                "liquidity_threshold": liquidity_threshold,
                "fdic_headroom": round(fdic_remaining, 2),
                "fdic_covered": sweep_amount <= fdic_remaining,
                "annual_yield_improvement": round(annual_improvement, 2),
                "source_accounts": sweep_opportunities,
                "data_stale": any_stale,
            },
        }

        return recommendation

    def _get_available_vehicles(
        self, approved_types: list[str]
    ) -> list[dict[str, Any]]:
        """Get available yield vehicles with current rates."""
        # In production, this would query a yield rate service
        all_vehicles = [
            {"type": "hysa", "provider": "Treasury Prime", "apy": 0.0450, "institution": "Partner Bank", "fdic_insured": True},
            {"type": "money_market", "provider": "Apex", "apy": 0.0475, "institution": "Apex Bank", "fdic_insured": True},
            {"type": "treasury_bill", "provider": "Treasury Direct", "apy": 0.0520, "institution": "US Treasury", "fdic_insured": False},
        ]

        return [v for v in all_vehicles if v["type"] in approved_types]

    def _calculate_fdic_headroom(
        self,
        user_features: dict[str, Any],
        target_institution: str,
    ) -> float:
        """Calculate remaining FDIC insurance capacity at target institution."""
        existing_deposits = user_features.get("deposits_by_institution", {})
        current_at_institution = existing_deposits.get(target_institution, 0)
        return max(FDIC_LIMIT - current_at_institution, 0)

    def _generate_explanation(
        self,
        sweep_amount: float,
        vehicle: dict[str, Any],
        annual_improvement: float,
        any_stale: bool,
    ) -> str:
        """Generate user-facing explanation."""
        parts = [
            f"You have ${sweep_amount:,.2f} in idle cash that could be earning more.",
            f"Moving it to a {vehicle['type'].upper()} at {vehicle['apy']*100:.2f}% APY "
            f"could earn you an additional ${annual_improvement:,.2f} per year.",
        ]

        if vehicle.get("fdic_insured"):
            parts.append("This account is FDIC insured up to $250,000.")
        else:
            parts.append("Note: This vehicle is backed by US Treasury securities (not FDIC insured).")

        if any_stale:
            parts.append(
                "Some balance data may be outdated. "
                "We recommend reviewing before proceeding."
            )

        return " ".join(parts)
