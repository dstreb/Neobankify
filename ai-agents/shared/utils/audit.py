"""
Audit logging utility for AI agent decisions.
All automated financial decisions MUST be logged here.
Retention: 7 years (regulatory requirement).
"""
import json
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from confluent_kafka import Producer


class AuditLogger:
    """
    Immutable audit logger for AI agent decisions.
    Publishes to Kafka audit.immutable topic.
    """

    def __init__(self, agent_type: str, kafka_brokers: str = "localhost:9092"):
        self.agent_type = agent_type
        self.producer = Producer({"bootstrap.servers": kafka_brokers})
        self.topic = "audit.immutable"

    def log_decision(
        self,
        tenant_id: str,
        user_id: str,
        decision_type: str,
        decision: dict[str, Any],
        reasoning: str,
        confidence_score: float,
        input_features: list[str],
        guardrails_checked: list[str],
        guardrails_triggered: list[str],
        outcome: str,  # recommended | executed | blocked
        correlation_id: Optional[str] = None,
    ) -> str:
        """Log an AI agent decision to the immutable audit trail."""
        audit_id = str(uuid.uuid4())

        audit_entry = {
            "eventId": audit_id,
            "eventType": "audit.immutable",
            "tenantId": tenant_id,
            "userId": user_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": 1,
            "correlationId": correlation_id or str(uuid.uuid4()),
            "source": f"ai-agent/{self.agent_type}",
            "data": {
                "entityType": "agent_decision",
                "entityId": audit_id,
                "actorType": "agent",
                "actorId": self.agent_type,
                "action": decision_type,
                "beforeState": None,
                "afterState": {
                    "decision": decision,
                    "reasoning": reasoning,
                    "confidenceScore": confidence_score,
                    "inputFeatures": input_features,
                    "guardrailsChecked": guardrails_checked,
                    "guardrailsTriggered": guardrails_triggered,
                    "outcome": outcome,
                },
            },
        }

        self.producer.produce(
            self.topic,
            key=user_id.encode("utf-8"),
            value=json.dumps(audit_entry).encode("utf-8"),
        )
        self.producer.flush()

        return audit_id

    def log_guardrail_block(
        self,
        tenant_id: str,
        user_id: str,
        blocked_action: str,
        rule_triggered: str,
        severity: str,
        details: dict[str, Any],
    ) -> str:
        """Log when a guardrail blocks an action."""
        return self.log_decision(
            tenant_id=tenant_id,
            user_id=user_id,
            decision_type=f"guardrail_block:{blocked_action}",
            decision={"blocked": True, "rule": rule_triggered, "details": details},
            reasoning=f"Action blocked by guardrail: {rule_triggered}",
            confidence_score=1.0,  # Guardrail decisions are deterministic
            input_features=list(details.keys()),
            guardrails_checked=[rule_triggered],
            guardrails_triggered=[rule_triggered],
            outcome="blocked",
        )
