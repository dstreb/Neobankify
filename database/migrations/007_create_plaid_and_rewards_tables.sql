-- Migration: 007_create_plaid_and_rewards_tables
-- Description: Plaid items tracking, quarterly bonus categories, and card-linked offers
-- Phase 1: Backend Integrations

-- =====================================================
-- PLAID ITEMS (tracks Plaid Link connections)
-- =====================================================
CREATE TABLE plaid_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    plaid_item_id VARCHAR(255) NOT NULL UNIQUE,
    access_token_encrypted TEXT NOT NULL,
    institution_id VARCHAR(100),
    institution_name VARCHAR(255),
    sync_cursor TEXT, -- Cursor for transactions/sync pagination
    last_synced_at TIMESTAMPTZ,
    error_code VARCHAR(100),
    error_message TEXT,
    consent_expiration_time TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'error', 'login_required', 'disconnected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_plaid_items_user ON plaid_items(user_id);
CREATE INDEX idx_plaid_items_tenant ON plaid_items(tenant_id);
CREATE INDEX idx_plaid_items_plaid_id ON plaid_items(plaid_item_id);
CREATE INDEX idx_plaid_items_status ON plaid_items(user_id, status) WHERE status = 'active';

-- =====================================================
-- QUARTERLY BONUSES (rotating category bonuses per card)
-- =====================================================
CREATE TABLE quarterly_bonuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    card_id UUID NOT NULL REFERENCES user_cards(id),
    reward_program_id UUID REFERENCES reward_programs(id),
    category VARCHAR(50) NOT NULL,
    earn_rate NUMERIC(5, 4) NOT NULL, -- e.g., 0.05 for 5%
    quarter_start DATE NOT NULL,
    quarter_end DATE NOT NULL,
    activation_required BOOLEAN DEFAULT FALSE,
    activated_at TIMESTAMPTZ,
    max_spend NUMERIC(10, 2), -- Quarterly spending cap for bonus rate
    current_spend NUMERIC(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT quarterly_bonuses_date_check CHECK (quarter_end > quarter_start)
);

CREATE INDEX idx_quarterly_bonuses_card ON quarterly_bonuses(card_id);
CREATE INDEX idx_quarterly_bonuses_tenant ON quarterly_bonuses(tenant_id);
CREATE INDEX idx_quarterly_bonuses_active ON quarterly_bonuses(card_id, quarter_end)
    WHERE quarter_end > NOW();

-- =====================================================
-- CARD-LINKED OFFERS (merchant-specific cashback/bonus)
-- =====================================================
CREATE TABLE card_linked_offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    card_id UUID NOT NULL REFERENCES user_cards(id),
    merchant_name VARCHAR(255) NOT NULL,
    merchant_normalized VARCHAR(255),
    cashback_pct NUMERIC(5, 4) NOT NULL, -- e.g., 0.10 for 10%
    max_cashback NUMERIC(10, 2) NOT NULL DEFAULT 50.00,
    min_transaction NUMERIC(10, 2) DEFAULT 0,
    current_earned NUMERIC(10, 2) DEFAULT 0,
    offer_source VARCHAR(50) DEFAULT 'issuer', -- issuer, plaid, network
    expires_at TIMESTAMPTZ NOT NULL,
    activated_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'activated', 'redeemed', 'expired', 'maxed_out')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_card_linked_offers_card ON card_linked_offers(card_id);
CREATE INDEX idx_card_linked_offers_tenant ON card_linked_offers(tenant_id);
CREATE INDEX idx_card_linked_offers_active ON card_linked_offers(card_id, status, expires_at)
    WHERE status IN ('active', 'activated');
CREATE INDEX idx_card_linked_offers_merchant ON card_linked_offers(merchant_normalized);

-- =====================================================
-- Add unique constraint on provider_transaction_id for upsert support
-- =====================================================
CREATE UNIQUE INDEX idx_transactions_provider_unique
    ON transactions(provider_transaction_id)
    WHERE provider_transaction_id IS NOT NULL;

-- =====================================================
-- Add last_synced_at to plaid_items for efficient sync scheduling
-- =====================================================
CREATE INDEX idx_plaid_items_sync ON plaid_items(last_synced_at NULLS FIRST)
    WHERE status = 'active';
