-- Migration: 005_create_audit_compliance
-- Description: Immutable audit log + compliance rules and alerts

-- =====================================================
-- AUDIT LOG (IMMUTABLE — append-only, 7-year retention)
-- =====================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID,
    event_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    actor_type VARCHAR(20) NOT NULL DEFAULT 'system' CHECK (actor_type IN ('user', 'agent', 'system', 'admin')),
    actor_id VARCHAR(255),
    action VARCHAR(100),
    before_state JSONB,
    after_state JSONB,
    correlation_id UUID,
    source VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition-friendly: in production, partition by month
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_action ON audit_log(action, created_at DESC);
CREATE INDEX idx_audit_log_correlation ON audit_log(correlation_id);

-- Prevent updates and deletes on audit_log (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit log entries cannot be modified or deleted';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_immutable_update
    BEFORE UPDATE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

CREATE TRIGGER audit_log_immutable_delete
    BEFORE DELETE ON audit_log
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_modification();

-- =====================================================
-- COMPLIANCE RULES
-- =====================================================
CREATE TABLE compliance_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('transaction_limit', 'velocity_check', 'kyc_requirement', 'aml_screen', 'credit_utilization', 'custom')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    threshold JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_rules_tenant ON compliance_rules(tenant_id);

-- =====================================================
-- COMPLIANCE ALERTS
-- =====================================================
CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),
    rule_id UUID REFERENCES compliance_rules(id),
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    rule_triggered VARCHAR(255),
    description TEXT,
    evidence JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'escalated', 'false_positive')),
    resolution TEXT,
    notes TEXT,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_compliance_alerts_tenant ON compliance_alerts(tenant_id, created_at DESC);
CREATE INDEX idx_compliance_alerts_status ON compliance_alerts(tenant_id, status);
CREATE INDEX idx_compliance_alerts_user ON compliance_alerts(user_id);
CREATE INDEX idx_compliance_alerts_severity ON compliance_alerts(severity, status);
