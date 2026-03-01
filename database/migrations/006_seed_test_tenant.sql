-- Migration: 006_seed_test_tenant
-- Description: Seeds initial test tenant for development and internal testing

-- Insert test tenant
INSERT INTO tenants (id, name, slug, status, config, theme, feature_flags) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Neobankify Internal',
    'neobankify-internal',
    'active',
    '{
        "allowedYieldVehicles": ["hysa", "money_market", "treasury_bill"],
        "maxIdleCashSweepPct": 0.80,
        "defaultLiquidityThreshold": 1000,
        "kycProvider": "persona",
        "notificationChannels": ["push", "email", "in_app"],
        "maxCardsPerUser": 20,
        "transactionEnrichmentEnabled": true
    }'::jsonb,
    '{
        "primaryColor": "#2563EB",
        "secondaryColor": "#7C3AED",
        "accentColor": "#10B981",
        "backgroundColor": "#F9FAFB",
        "textColor": "#111827",
        "logoUrl": "/assets/neobankify-logo.svg",
        "appName": "Neobankify",
        "fontFamily": "Inter"
    }'::jsonb,
    '{
        "rewardsOptimization": true,
        "idleCashSweep": true,
        "behavioralLearning": true,
        "investmentModule": false,
        "tradingModule": false,
        "lendingModule": false,
        "advancedAnalytics": true,
        "exportReports": true
    }'::jsonb
);

-- Insert sample reward programs
INSERT INTO reward_programs (id, tenant_id, name, issuer, program_type, base_earn_rate, category_rates, point_value_cents, annual_fee) VALUES
(
    '00000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000001',
    'Chase Sapphire Preferred',
    'Chase',
    'points',
    0.01,
    '{"dining": 0.03, "travel": 0.02, "streaming": 0.03, "groceries": 0.03}'::jsonb,
    1.25,
    95.00
),
(
    '00000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000001',
    'Citi Double Cash',
    'Citi',
    'cashback',
    0.02,
    '{}'::jsonb,
    1.00,
    0
),
(
    '00000000-0000-0000-0000-000000000103',
    '00000000-0000-0000-0000-000000000001',
    'Amex Gold',
    'American Express',
    'points',
    0.01,
    '{"dining": 0.04, "groceries": 0.04, "travel": 0.03}'::jsonb,
    1.00,
    250.00
),
(
    '00000000-0000-0000-0000-000000000104',
    '00000000-0000-0000-0000-000000000001',
    'Discover it Cash Back',
    'Discover',
    'cashback',
    0.01,
    '{"rotating": 0.05}'::jsonb,
    1.00,
    0
);

-- Insert default compliance rules
INSERT INTO compliance_rules (tenant_id, name, description, rule_type, severity, threshold) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Single Transaction Limit',
    'Alert on transactions exceeding $10,000 (BSA reporting threshold)',
    'transaction_limit',
    'high',
    '{"amount": 10000, "currency": "USD"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000001',
    'Velocity Check - Daily',
    'Alert when daily transaction count exceeds 50',
    'velocity_check',
    'medium',
    '{"count": 50, "period": "day"}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000001',
    'Credit Utilization Warning',
    'Alert when credit utilization exceeds 75%',
    'credit_utilization',
    'medium',
    '{"utilization_pct": 0.75}'::jsonb
),
(
    '00000000-0000-0000-0000-000000000001',
    'KYC Expiry Check',
    'Alert 30 days before KYC verification expires',
    'kyc_requirement',
    'high',
    '{"days_before_expiry": 30}'::jsonb
);
