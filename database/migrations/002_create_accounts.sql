-- Migration: 002_create_accounts
-- Description: Linked accounts, cards, and financial instruments

-- =====================================================
-- LINKED ACCOUNTS (Plaid/MX/Finicity)
-- =====================================================
CREATE TABLE linked_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('plaid', 'mx', 'finicity')),
    provider_account_id VARCHAR(255),
    access_token_encrypted TEXT, -- Encrypted with KMS
    account_type VARCHAR(50) NOT NULL CHECK (account_type IN ('checking', 'savings', 'credit', 'investment', 'loan', 'mortgage')),
    institution_name VARCHAR(255),
    mask VARCHAR(10),
    current_balance NUMERIC(15, 2) DEFAULT 0,
    available_balance NUMERIC(15, 2) DEFAULT 0,
    credit_limit NUMERIC(15, 2),
    currency VARCHAR(3) DEFAULT 'USD',
    last_synced_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disconnected', 'error', 'pending')),
    error_code VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_linked_accounts_user ON linked_accounts(user_id);
CREATE INDEX idx_linked_accounts_status ON linked_accounts(user_id, status);
CREATE INDEX idx_linked_accounts_provider ON linked_accounts(provider, provider_account_id);

-- =====================================================
-- USER CARDS
-- =====================================================
CREATE TABLE user_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    card_name VARCHAR(255) NOT NULL,
    issuer VARCHAR(100) NOT NULL,
    network VARCHAR(20) NOT NULL CHECK (network IN ('visa', 'mastercard', 'amex', 'discover')),
    last_four VARCHAR(4),
    reward_program_id UUID,
    is_primary BOOLEAN DEFAULT FALSE,
    credit_limit NUMERIC(15, 2),
    current_balance NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'removed', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_cards_user ON user_cards(user_id);
CREATE INDEX idx_user_cards_active ON user_cards(user_id, status) WHERE status = 'active';

-- =====================================================
-- REWARD PROGRAMS
-- =====================================================
CREATE TABLE reward_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    issuer VARCHAR(100) NOT NULL,
    program_type VARCHAR(20) NOT NULL CHECK (program_type IN ('cashback', 'points', 'miles')),
    base_earn_rate NUMERIC(5, 4) NOT NULL DEFAULT 0.01,
    category_rates JSONB DEFAULT '{}', -- { "dining": 0.03, "groceries": 0.06 }
    point_value_cents NUMERIC(5, 2) DEFAULT 1.00,
    annual_fee NUMERIC(8, 2) DEFAULT 0,
    signup_bonus JSONB, -- { "points": 60000, "spendRequired": 4000, "timeframeDays": 90 }
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reward_programs_tenant ON reward_programs(tenant_id);
CREATE INDEX idx_reward_programs_issuer ON reward_programs(issuer);
