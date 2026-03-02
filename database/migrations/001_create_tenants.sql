-- Migration: 001_create_tenants
-- Description: Core tenant tables for multi-tenant white-label platform
-- Schema isolation: All tenant-specific data references tenant_id

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- TENANTS
-- =====================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'onboarding')),
    config JSONB NOT NULL DEFAULT '{}',
    theme JSONB NOT NULL DEFAULT '{}',
    feature_flags JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_status ON tenants(status);

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(320) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    kyc_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_progress', 'approved', 'rejected', 'review', 'expired')),
    kyc_provider VARCHAR(50),
    kyc_reference_id VARCHAR(255),
    risk_profile VARCHAR(20) DEFAULT 'moderate' CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
    goals JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(tenant_id, email);
CREATE INDEX idx_users_kyc_status ON users(kyc_status);

-- =====================================================
-- USER GOALS
-- =====================================================
CREATE TABLE user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('maximize_cashback', 'travel_rewards', 'points_maximizer', 'minimize_fees', 'grow_savings')),
    parameters JSONB DEFAULT '{}',
    priority INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_goals_user ON user_goals(user_id);
CREATE INDEX idx_user_goals_active ON user_goals(user_id, status) WHERE status = 'active';
