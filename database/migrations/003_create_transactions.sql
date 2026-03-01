-- Migration: 003_create_transactions
-- Description: Transaction ingestion, enrichment, and reward tracking

-- =====================================================
-- TRANSACTIONS
-- =====================================================
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID REFERENCES linked_accounts(id),
    tenant_id UUID REFERENCES tenants(id),
    provider_transaction_id VARCHAR(255),
    amount NUMERIC(15, 2) NOT NULL,
    merchant_name VARCHAR(500) NOT NULL,
    merchant_normalized VARCHAR(500),
    mcc_code VARCHAR(10),
    category VARCHAR(50),
    subcategory VARCHAR(50),
    transaction_date TIMESTAMPTZ NOT NULL,
    posted_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'posted', 'cancelled', 'returned')),
    reward_eligible BOOLEAN,
    enrichment_confidence NUMERIC(3, 2),
    enrichment_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partition-ready index strategy (partition by month in production)
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX idx_transactions_category ON transactions(user_id, category);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_normalized);
CREATE INDEX idx_transactions_provider ON transactions(provider_transaction_id);
CREATE INDEX idx_transactions_tenant ON transactions(tenant_id, transaction_date DESC);

-- =====================================================
-- REWARDS EARNED (immutable log of reward events)
-- =====================================================
CREATE TABLE rewards_earned (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    transaction_id UUID REFERENCES transactions(id),
    card_id UUID REFERENCES user_cards(id),
    reward_program_id UUID REFERENCES reward_programs(id),
    points_earned NUMERIC(12, 2) DEFAULT 0,
    cashback_earned NUMERIC(10, 4) DEFAULT 0,
    earn_rate NUMERIC(5, 4),
    was_optimal BOOLEAN DEFAULT FALSE,
    optimal_card_id UUID,
    missed_value NUMERIC(10, 4) DEFAULT 0, -- Value left on table
    agent_decision_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rewards_earned_user ON rewards_earned(user_id, created_at DESC);
CREATE INDEX idx_rewards_earned_transaction ON rewards_earned(transaction_id);
CREATE INDEX idx_rewards_earned_card ON rewards_earned(card_id);
