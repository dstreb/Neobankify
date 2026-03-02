-- Migration: 009_create_investment_tables
-- Description: Investment/portfolio management tables for Phase 2
-- Supports: Suitability profiles, investment accounts, portfolios, holdings, rebalancing

-- =====================================================
-- SUITABILITY PROFILES
-- =====================================================
CREATE TABLE suitability_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    risk_tolerance VARCHAR(20) NOT NULL CHECK (risk_tolerance IN ('conservative', 'moderate_conservative', 'moderate', 'moderate_aggressive', 'aggressive')),
    investment_horizon VARCHAR(20) NOT NULL CHECK (investment_horizon IN ('short_term', 'medium_term', 'long_term', 'retirement')),
    annual_income_range VARCHAR(30) NOT NULL CHECK (annual_income_range IN ('under_25k', '25k_50k', '50k_100k', '100k_250k', '250k_500k', 'over_500k')),
    net_worth_range VARCHAR(30) NOT NULL CHECK (net_worth_range IN ('under_25k', '25k_100k', '100k_500k', '500k_1m', '1m_5m', 'over_5m')),
    investment_experience VARCHAR(20) NOT NULL CHECK (investment_experience IN ('none', 'limited', 'moderate', 'extensive')),
    investment_objective VARCHAR(30) NOT NULL CHECK (investment_objective IN ('capital_preservation', 'income', 'growth_income', 'growth', 'aggressive_growth')),
    liquidity_needs VARCHAR(20) NOT NULL DEFAULT 'moderate' CHECK (liquidity_needs IN ('low', 'moderate', 'high')),
    tax_bracket VARCHAR(10),
    is_accredited_investor BOOLEAN NOT NULL DEFAULT false,
    risk_score NUMERIC(5,2) NOT NULL DEFAULT 50.00,
    questionnaire_responses JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_suitability_user ON suitability_profiles(user_id);
CREATE INDEX idx_suitability_tenant ON suitability_profiles(tenant_id);
CREATE UNIQUE INDEX idx_suitability_active ON suitability_profiles(user_id, tenant_id) WHERE status = 'active';

-- =====================================================
-- INVESTMENT ACCOUNTS
-- =====================================================
CREATE TABLE investment_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    account_type VARCHAR(30) NOT NULL CHECK (account_type IN ('individual', 'joint', 'ira_traditional', 'ira_roth', 'sep_ira', 'custodial')),
    provider VARCHAR(50) NOT NULL DEFAULT 'drivewealth',
    provider_account_id VARCHAR(255),
    account_number VARCHAR(50),
    cash_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_gain_loss NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    total_gain_loss_pct NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    day_gain_loss NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    funding_status VARCHAR(20) NOT NULL DEFAULT 'unfunded' CHECK (funding_status IN ('unfunded', 'pending', 'funded')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'closed', 'pending_approval')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investment_accounts_user ON investment_accounts(user_id);
CREATE INDEX idx_investment_accounts_tenant ON investment_accounts(tenant_id);
CREATE INDEX idx_investment_accounts_provider ON investment_accounts(provider, provider_account_id);

-- =====================================================
-- PORTFOLIOS (model portfolios and user allocations)
-- =====================================================
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    investment_account_id UUID REFERENCES investment_accounts(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    portfolio_type VARCHAR(30) NOT NULL CHECK (portfolio_type IN ('model', 'user_custom', 'goal_based', 'tax_optimized')),
    strategy VARCHAR(30) NOT NULL CHECK (strategy IN ('passive_index', 'factor_based', 'esg', 'dividend_income', 'growth', 'balanced', 'target_date')),
    target_allocation JSONB NOT NULL DEFAULT '{}',
    current_allocation JSONB DEFAULT '{}',
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('conservative', 'moderate_conservative', 'moderate', 'moderate_aggressive', 'aggressive')),
    benchmark VARCHAR(50) DEFAULT 'SPY',
    rebalance_frequency VARCHAR(20) NOT NULL DEFAULT 'quarterly' CHECK (rebalance_frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually', 'threshold')),
    rebalance_threshold NUMERIC(5,2) DEFAULT 5.00,
    tax_loss_harvesting_enabled BOOLEAN NOT NULL DEFAULT false,
    total_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    inception_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'closed', 'draft')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_portfolios_tenant ON portfolios(tenant_id);
CREATE INDEX idx_portfolios_account ON portfolios(investment_account_id);
CREATE INDEX idx_portfolios_type ON portfolios(portfolio_type);

-- =====================================================
-- HOLDINGS (individual positions within a portfolio)
-- =====================================================
CREATE TABLE holdings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id),
    investment_account_id UUID NOT NULL REFERENCES investment_accounts(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    symbol VARCHAR(20) NOT NULL,
    asset_type VARCHAR(20) NOT NULL CHECK (asset_type IN ('stock', 'etf', 'mutual_fund', 'bond', 'cash', 'crypto')),
    quantity NUMERIC(18,8) NOT NULL DEFAULT 0,
    avg_cost_basis NUMERIC(15,4) NOT NULL DEFAULT 0,
    current_price NUMERIC(15,4) NOT NULL DEFAULT 0,
    market_value NUMERIC(15,2) NOT NULL DEFAULT 0,
    unrealized_gain_loss NUMERIC(15,2) NOT NULL DEFAULT 0,
    unrealized_gain_loss_pct NUMERIC(8,4) NOT NULL DEFAULT 0,
    target_weight NUMERIC(5,2) NOT NULL DEFAULT 0,
    current_weight NUMERIC(5,2) NOT NULL DEFAULT 0,
    tax_lots JSONB DEFAULT '[]',
    last_price_update TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_holdings_portfolio ON holdings(portfolio_id);
CREATE INDEX idx_holdings_account ON holdings(investment_account_id);
CREATE INDEX idx_holdings_tenant ON holdings(tenant_id);
CREATE INDEX idx_holdings_symbol ON holdings(symbol);

-- =====================================================
-- INVESTMENT ORDERS
-- =====================================================
CREATE TABLE investment_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    investment_account_id UUID NOT NULL REFERENCES investment_accounts(id),
    portfolio_id UUID REFERENCES portfolios(id),
    symbol VARCHAR(20) NOT NULL,
    order_type VARCHAR(20) NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
    side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
    quantity NUMERIC(18,8),
    amount NUMERIC(15,2),
    limit_price NUMERIC(15,4),
    stop_price NUMERIC(15,4),
    filled_quantity NUMERIC(18,8) DEFAULT 0,
    filled_avg_price NUMERIC(15,4) DEFAULT 0,
    commission NUMERIC(10,2) DEFAULT 0,
    provider_order_id VARCHAR(255),
    trigger VARCHAR(30) CHECK (trigger IN ('user', 'rebalance', 'tax_loss_harvest', 'dca', 'ai_recommendation')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'partial_fill', 'filled', 'cancelled', 'rejected', 'expired')),
    submitted_at TIMESTAMPTZ,
    filled_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investment_orders_user ON investment_orders(user_id);
CREATE INDEX idx_investment_orders_tenant ON investment_orders(tenant_id);
CREATE INDEX idx_investment_orders_account ON investment_orders(investment_account_id);
CREATE INDEX idx_investment_orders_status ON investment_orders(status);
CREATE INDEX idx_investment_orders_symbol ON investment_orders(symbol);

-- =====================================================
-- REBALANCE EVENTS
-- =====================================================
CREATE TABLE rebalance_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    trigger VARCHAR(30) NOT NULL CHECK (trigger IN ('scheduled', 'threshold', 'manual', 'ai_recommended')),
    drift_before JSONB NOT NULL DEFAULT '{}',
    trades_proposed JSONB NOT NULL DEFAULT '[]',
    trades_executed JSONB DEFAULT '[]',
    tax_impact_estimate NUMERIC(15,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executing', 'completed', 'cancelled', 'failed')),
    approved_by VARCHAR(50),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rebalance_portfolio ON rebalance_events(portfolio_id);
CREATE INDEX idx_rebalance_tenant ON rebalance_events(tenant_id);
CREATE INDEX idx_rebalance_status ON rebalance_events(status);

-- =====================================================
-- INVESTMENT TRANSFERS (deposits/withdrawals)
-- =====================================================
CREATE TABLE investment_transfers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES investment_accounts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
    amount NUMERIC(15,2) NOT NULL,
    funding_source_id UUID,
    provider_transfer_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_investment_transfers_account ON investment_transfers(account_id);
CREATE INDEX idx_investment_transfers_user ON investment_transfers(user_id);
CREATE INDEX idx_investment_transfers_tenant ON investment_transfers(tenant_id);
CREATE INDEX idx_investment_transfers_status ON investment_transfers(status);

-- =====================================================
-- TAX LOT TRACKING (for tax-loss harvesting)
-- =====================================================
CREATE TABLE tax_lots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holding_id UUID NOT NULL REFERENCES holdings(id),
    investment_account_id UUID NOT NULL REFERENCES investment_accounts(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    symbol VARCHAR(20) NOT NULL,
    quantity NUMERIC(18,8) NOT NULL,
    cost_basis NUMERIC(15,4) NOT NULL,
    acquisition_date DATE NOT NULL,
    is_short_term BOOLEAN NOT NULL DEFAULT true,
    realized_gain_loss NUMERIC(15,2),
    wash_sale_disallowed NUMERIC(15,2) DEFAULT 0,
    sold_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'partial')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tax_lots_holding ON tax_lots(holding_id);
CREATE INDEX idx_tax_lots_account ON tax_lots(investment_account_id);
CREATE INDEX idx_tax_lots_tenant ON tax_lots(tenant_id);
CREATE INDEX idx_tax_lots_symbol ON tax_lots(symbol);
CREATE INDEX idx_tax_lots_open ON tax_lots(status) WHERE status = 'open';

-- =====================================================
-- Compatibility renames / extensions to match service code
-- =====================================================

-- Suitability profiles are referenced as investment_profiles in service code
ALTER TABLE suitability_profiles
    ADD COLUMN risk_level VARCHAR(20) CHECK (risk_level IN ('conservative', 'moderate_conservative', 'moderate', 'moderate_aggressive', 'aggressive')),
    ADD COLUMN recommended_strategy VARCHAR(30),
    ADD COLUMN recommended_allocation JSONB DEFAULT '{}',
    ADD COLUMN suitability_explanation TEXT,
    ADD COLUMN suitability_warnings JSONB NOT NULL DEFAULT '[]',
    ADD COLUMN assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE suitability_profiles RENAME TO investment_profiles;

-- Investment accounts include external_account_id in service code
ALTER TABLE investment_accounts ADD COLUMN external_account_id VARCHAR(255);

-- Portfolios are referenced as investment_portfolios in service code
ALTER TABLE portfolios
    ADD COLUMN user_id UUID REFERENCES users(id),
    ADD COLUMN profile_id UUID REFERENCES investment_profiles(id),
    ADD COLUMN total_invested NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN total_returns NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN total_returns_pct NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    ADD COLUMN auto_rebalance BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN dividend_reinvestment BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN last_rebalanced_at TIMESTAMPTZ;

ALTER TABLE portfolios ALTER COLUMN portfolio_type SET DEFAULT 'user_custom';
ALTER TABLE portfolios ALTER COLUMN risk_level SET DEFAULT 'moderate';

ALTER TABLE portfolios RENAME COLUMN tax_loss_harvesting_enabled TO tax_loss_harvesting;

ALTER TABLE portfolios DROP CONSTRAINT portfolios_status_check;
ALTER TABLE portfolios ADD CONSTRAINT portfolios_status_check CHECK (status IN ('pending_funding', 'active', 'paused', 'closed', 'draft'));

ALTER TABLE portfolios RENAME TO investment_portfolios;

-- Holdings are referenced as portfolio_holdings in service code
ALTER TABLE holdings RENAME COLUMN symbol TO ticker;
ALTER TABLE holdings RENAME COLUMN asset_type TO asset_class;
ALTER TABLE holdings RENAME COLUMN quantity TO shares;
ALTER TABLE holdings RENAME COLUMN avg_cost_basis TO cost_basis;
ALTER TABLE holdings RENAME COLUMN market_value TO current_value;
ALTER TABLE holdings ADD COLUMN name VARCHAR(255);
ALTER TABLE holdings ALTER COLUMN investment_account_id DROP NOT NULL;

ALTER TABLE holdings RENAME TO portfolio_holdings;

-- Allow flexible asset_class values from portfolio construction logic
ALTER TABLE portfolio_holdings DROP CONSTRAINT holdings_asset_type_check;

-- Investment orders align with service code naming
ALTER TABLE investment_orders ALTER COLUMN investment_account_id DROP NOT NULL;
ALTER TABLE investment_orders RENAME COLUMN symbol TO ticker;
ALTER TABLE investment_orders RENAME COLUMN amount TO amount_usd;
ALTER TABLE investment_orders RENAME COLUMN filled_avg_price TO filled_price;
ALTER TABLE investment_orders RENAME COLUMN provider_order_id TO external_order_id;
ALTER TABLE investment_orders ADD COLUMN time_in_force VARCHAR(10) NOT NULL DEFAULT 'day' CHECK (time_in_force IN ('day', 'gtc', 'ioc'));

-- Rebalance events are referenced as portfolio_rebalances in service code
ALTER TABLE rebalance_events RENAME COLUMN drift_before TO before_allocation;
ALTER TABLE rebalance_events RENAME COLUMN trades_proposed TO actions;
ALTER TABLE rebalance_events ADD COLUMN target_allocation JSONB DEFAULT '{}';

ALTER TABLE rebalance_events RENAME TO portfolio_rebalances;
