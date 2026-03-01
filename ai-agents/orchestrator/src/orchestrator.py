"""
Orchestrator Agent

Central coordinator for all financial AI agents.
- Receives enriched transaction events from Kafka
- Maintains user goal state
- Routes decisions to sub-agents in parallel
- Aggregates recommendations
- Passes all recommendations through Risk & Guardrail Agent
- Enforces global constraints and explainability
"""
import asyncio
import json
import logging
import time
import uuid
from dataclasses import dataclass
from typing import Any, Optional

logger = logging.getLogger(__name__)


@dataclass
class AgentResult:
    agent_type: str
    success: bool
    recommendation: Optional[dict[str, Any]] = None
    error: Optional[str] = None
    latency_ms: float = 0.0


@dataclass
class OrchestrationResult:
    correlation_id: str
    user_id: str
    tenant_id: str
    recommendations: list[dict[str, Any]]
    blocked_recommendations: list[dict[str, Any]]
    explanation: str
    total_latency_ms: float
    agent_results: list[AgentResult]


class OrchestratorAgent:
    """
    Orchestrator Agent - oversees all financial agents.

    Decision Flow:
    1. Parse incoming event
    2. Load user goal hierarchy from feature store
    3. Determine which sub-agents to invoke (based on event type + feature flags)
    4. Fan out to sub-agents in parallel
    5. Collect recommendations
    6. Pass all recommendations to Risk & Guardrail Agent
    7. Aggregate approved recommendations
    8. Generate user-facing explanation
    9. Publish to agent.decisions Kafka topic
    10. Trigger notification if action threshold met
    """

    def __init__(
        self,
        rewards_agent: Any,
        idle_cash_agent: Any,
        behavioral_agent: Any,
        risk_agent: Any,
        feature_store: Any,
        audit_logger: Any,
        kafka_producer: Any,
        config: Optional[dict[str, Any]] = None,
    ):
        self.rewards_agent = rewards_agent
        self.idle_cash_agent = idle_cash_agent
        self.behavioral_agent = behavioral_agent
        self.risk_agent = risk_agent
        self.feature_store = feature_store
        self.audit_logger = audit_logger
        self.kafka_producer = kafka_producer
        self.config = config or {}
        self.agent_timeout = self.config.get("agent_timeout_seconds", 2.0)
        self.confidence_threshold = self.config.get("confidence_threshold", 0.6)

    async def process_event(
        self,
        event: dict[str, Any],
        tenant_config: dict[str, Any],
    ) -> OrchestrationResult:
        """
        Main entry point. Processes an enriched event through the agent pipeline.
        """
        start_time = time.monotonic()
        correlation_id = event.get("correlationId", str(uuid.uuid4()))
        user_id = event["userId"]
        tenant_id = event["tenantId"]
        event_type = event["eventType"]

        logger.info(
            "Processing event",
            extra={
                "correlation_id": correlation_id,
                "user_id": user_id,
                "event_type": event_type,
            },
        )

        # Step 1: Load user context from feature store
        user_features = self.feature_store.get_user_profile_features(tenant_id, user_id)
        feature_flags = tenant_config.get("featureFlags", {})

        # Step 2: Determine which agents to invoke
        agents_to_invoke = self._select_agents(event_type, feature_flags)

        # Step 3: Fan out to sub-agents in parallel (with timeout)
        agent_results = await self._invoke_agents_parallel(
            agents_to_invoke, event, user_features, tenant_config
        )

        # Step 4: Collect recommendations
        raw_recommendations = [
            r.recommendation
            for r in agent_results
            if r.success and r.recommendation is not None
        ]

        # Step 5: Pass through Risk & Guardrail Agent (always invoked)
        approved = []
        blocked = []
        for rec in raw_recommendations:
            guardrail_result = await self._check_guardrails(
                rec, user_features, tenant_id, user_id
            )
            if guardrail_result["approved"]:
                rec["guardrails_passed"] = guardrail_result["checks_passed"]
                approved.append(rec)
            else:
                rec["block_reason"] = guardrail_result["block_reason"]
                rec["guardrails_triggered"] = guardrail_result["triggered"]
                blocked.append(rec)

        # Step 6: Filter by confidence threshold
        final_recommendations = [
            r for r in approved
            if r.get("confidence_score", 0) >= self.confidence_threshold
        ]

        # Downgrade low-confidence to suggestions
        suggestions = [
            {**r, "type": "suggestion"}
            for r in approved
            if r.get("confidence_score", 0) < self.confidence_threshold
        ]

        # Step 7: Generate explanation
        explanation = self._generate_explanation(final_recommendations, suggestions)

        total_latency = (time.monotonic() - start_time) * 1000

        result = OrchestrationResult(
            correlation_id=correlation_id,
            user_id=user_id,
            tenant_id=tenant_id,
            recommendations=final_recommendations + suggestions,
            blocked_recommendations=blocked,
            explanation=explanation,
            total_latency_ms=total_latency,
            agent_results=agent_results,
        )

        # Step 8: Publish decisions and audit
        await self._publish_decisions(result)
        self._log_audit(result, event)

        logger.info(
            "Orchestration complete",
            extra={
                "correlation_id": correlation_id,
                "num_recommendations": len(final_recommendations),
                "num_blocked": len(blocked),
                "latency_ms": total_latency,
            },
        )

        return result

    def _select_agents(
        self, event_type: str, feature_flags: dict[str, Any]
    ) -> list[str]:
        """Determine which sub-agents to invoke based on event type and feature flags."""
        agents = []

        if event_type in ("transaction.enriched", "transaction.created"):
            if feature_flags.get("rewardsOptimization", True):
                agents.append("rewards_optimization")
            if feature_flags.get("behavioralLearning", True):
                agents.append("behavioral_learning")

        if event_type in ("balance.updated", "daily_sweep_check"):
            if feature_flags.get("idleCashSweep", True):
                agents.append("idle_cash")

        # Behavioral learning runs on all transaction events
        if event_type.startswith("transaction.") and "behavioral_learning" not in agents:
            if feature_flags.get("behavioralLearning", True):
                agents.append("behavioral_learning")

        return agents

    async def _invoke_agents_parallel(
        self,
        agent_names: list[str],
        event: dict[str, Any],
        user_features: dict[str, Any],
        tenant_config: dict[str, Any],
    ) -> list[AgentResult]:
        """Invoke multiple agents in parallel with timeout."""
        agent_map = {
            "rewards_optimization": self.rewards_agent,
            "idle_cash": self.idle_cash_agent,
            "behavioral_learning": self.behavioral_agent,
        }

        tasks = []
        task_agent_names = []
        for name in agent_names:
            agent = agent_map.get(name)
            if agent:
                tasks.append(
                    self._invoke_agent_with_timeout(name, agent, event, user_features, tenant_config)
                )
                task_agent_names.append(name)

        if not tasks:
            return []

        results = await asyncio.gather(*tasks, return_exceptions=True)

        agent_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                agent_results.append(
                    AgentResult(
                        agent_type=task_agent_names[i],
                        success=False,
                        error=str(result),
                    )
                )
            else:
                agent_results.append(result)

        return agent_results

    async def _invoke_agent_with_timeout(
        self,
        agent_name: str,
        agent: Any,
        event: dict[str, Any],
        user_features: dict[str, Any],
        tenant_config: dict[str, Any],
    ) -> AgentResult:
        """Invoke a single agent with timeout protection."""
        start = time.monotonic()
        try:
            recommendation = await asyncio.wait_for(
                agent.process(event, user_features, tenant_config),
                timeout=self.agent_timeout,
            )
            latency = (time.monotonic() - start) * 1000
            return AgentResult(
                agent_type=agent_name,
                success=True,
                recommendation=recommendation,
                latency_ms=latency,
            )
        except asyncio.TimeoutError:
            latency = (time.monotonic() - start) * 1000
            logger.warning(f"Agent {agent_name} timed out after {latency:.0f}ms")
            return AgentResult(
                agent_type=agent_name,
                success=False,
                error="timeout",
                latency_ms=latency,
            )
        except Exception as e:
            latency = (time.monotonic() - start) * 1000
            logger.error(f"Agent {agent_name} failed: {e}")
            return AgentResult(
                agent_type=agent_name,
                success=False,
                error=str(e),
                latency_ms=latency,
            )

    async def _check_guardrails(
        self,
        recommendation: dict[str, Any],
        user_features: dict[str, Any],
        tenant_id: str,
        user_id: str,
    ) -> dict[str, Any]:
        """Pass recommendation through Risk & Guardrail Agent."""
        try:
            result = await self.risk_agent.evaluate(
                recommendation, user_features, tenant_id, user_id
            )
            return result
        except Exception as e:
            logger.error(f"Guardrail check failed: {e}")
            # Fail safe: block if guardrails can't be evaluated
            return {
                "approved": False,
                "block_reason": "Guardrail evaluation failed - blocking for safety",
                "triggered": ["guardrail_evaluation_error"],
                "checks_passed": [],
            }

    def _generate_explanation(
        self,
        recommendations: list[dict[str, Any]],
        suggestions: list[dict[str, Any]],
    ) -> str:
        """Generate a user-facing explanation of all recommendations."""
        if not recommendations and not suggestions:
            return "No recommendations at this time."

        parts = []
        for rec in recommendations:
            if rec.get("explanation"):
                parts.append(rec["explanation"])

        for sug in suggestions:
            if sug.get("explanation"):
                parts.append(f"(Suggestion) {sug['explanation']}")

        return " | ".join(parts) if parts else "Recommendations generated."

    async def _publish_decisions(self, result: OrchestrationResult) -> None:
        """Publish decisions to Kafka for downstream consumers."""
        for rec in result.recommendations:
            event = {
                "eventId": str(uuid.uuid4()),
                "eventType": "agent.recommendation",
                "tenantId": result.tenant_id,
                "userId": result.user_id,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "correlationId": result.correlation_id,
                "version": 1,
                "source": "orchestrator",
                "data": rec,
            }
            try:
                self.kafka_producer.produce(
                    "agent.recommendations",
                    key=result.user_id.encode("utf-8"),
                    value=json.dumps(event).encode("utf-8"),
                )
            except Exception as e:
                logger.error(f"Failed to publish recommendation: {e}")

        self.kafka_producer.flush()

    def _log_audit(self, result: OrchestrationResult, original_event: dict[str, Any]) -> None:
        """Log orchestration result to audit trail."""
        self.audit_logger.log_decision(
            tenant_id=result.tenant_id,
            user_id=result.user_id,
            decision_type="orchestration",
            decision={
                "num_recommendations": len(result.recommendations),
                "num_blocked": len(result.blocked_recommendations),
                "agent_latencies": {r.agent_type: r.latency_ms for r in result.agent_results},
            },
            reasoning=result.explanation,
            confidence_score=max(
                (r.get("confidence_score", 0) for r in result.recommendations),
                default=0,
            ),
            input_features=["user_profile", "transaction", "feature_flags"],
            guardrails_checked=["risk_guardrail_agent"],
            guardrails_triggered=[
                r.get("block_reason", "")
                for r in result.blocked_recommendations
                if r.get("block_reason")
            ],
            outcome="recommended" if result.recommendations else "no_action",
            correlation_id=result.correlation_id,
        )
