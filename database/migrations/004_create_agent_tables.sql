-- Migration: 004_create_agent_tables
-- Description: AI agent decisions, recommendations, and idle cash positions

-- =====================================================
-- AGENT DECISIONS (audit trail for all AI decisions)
-- =====================================================
CREATE TABLE agent_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('orchestrator', 'rewards_optimization', 'idle_cash', 'risk_guardrail', 'behavioral_learning')),
    decision_type VARCHAR(100) NOT NULL,
    decision JSONB NOT NULL,
    reasoning TEXT NOT NULL,
    confidence_score NUMERIC(3, 2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    input_features TEXT[],
    guardrails_checked TEXT[],
    guardrails_triggered TEXT[],
    outcome VARCHAR(20) NOT NULL DEFAULT 'recommended' CHECK (outcome IN ('recommended', 'executed', 'blocked', 'expired', 'dismissed', 'overridden')),
    correlation_id UUID,
    latency_ms NUMERIC(8, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_agent_decisions_user ON agent_decisions(user_id, created_at DESC);
CREATE INDEX idx_agent_decisions_type ON agent_decisions(agent_type, created_at DESC);
CREATE INDEX idx_agent_decisions_tenant ON agent_decisions(tenant_id, created_at DESC);
CREATE INDEX idx_agent_decisions_correlation ON agent_decisions(correlation_id);

-- =====================================================
-- RECOMMENDATIONS (user-facing recommendations from agents)
-- =====================================================
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    agent_decision_id UUID REFERENCES agent_decisions(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    explanation TEXT,
    confidence_score NUMERIC(3, 2),
    value_delta NUMERIC(10, 2),
    data JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'recommended' CHECK (status IN ('recommended', 'accepted', 'dismissed', 'expired', 'executed', 'overridden')),
    override_reason TEXT,
    expires_at TIMESTAMPTZ,
    acted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON recommendations(user_id, created_at DESC);
CREATE INDEX idx_recommendations_status ON recommendations(user_id, status);
CREATE INDEX idx_recommendations_active ON recommendations(user_id, status, expires_at)
    WHERE status = 'recommended';

-- =====================================================
-- IDLE CASH POSITIONS
-- =====================================================
CREATE TABLE idle_cash_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    vehicle_type VARCHAR(30) NOT NULL CHECK (vehicle_type IN ('hysa', 'money_market', 'treasury_bill', 'cd')),
    provider VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    apy NUMERIC(6, 4) NOT NULL,
    fdic_insured BOOLEAN DEFAULT TRUE,
    maturity_date TIMESTAMPTZ,
    auto_renew BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'matured', 'withdrawn', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_idle_cash_user ON idle_cash_positions(user_id);
CREATE INDEX idx_idle_cash_active ON idle_cash_positions(user_id, status) WHERE status = 'active';
