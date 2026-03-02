-- Migration: 012_add_phase2_agent_types
-- Description: Expand agent_decisions CHECK constraint to include Phase 2 agent types
-- (credit_underwriting, investment_advisor, trading_strategy)

-- Drop the existing CHECK constraint on agent_type
ALTER TABLE agent_decisions DROP CONSTRAINT IF EXISTS agent_decisions_agent_type_check;

-- Add updated CHECK constraint with Phase 2 agent types
ALTER TABLE agent_decisions ADD CONSTRAINT agent_decisions_agent_type_check
    CHECK (agent_type IN (
        'orchestrator',
        'rewards_optimization',
        'idle_cash',
        'risk_guardrail',
        'behavioral_learning',
        'credit_underwriting',
        'investment_advisor',
        'trading_strategy'
    ));
