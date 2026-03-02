-- Migration: 013_add_tenant_id_to_rewards_earned
-- Description: Add tenant_id column to rewards_earned table for multi-tenant isolation

ALTER TABLE rewards_earned
    ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Backfill tenant_id from the user's tenant (via users table)
UPDATE rewards_earned re
    SET tenant_id = u.tenant_id
    FROM users u
    WHERE re.user_id = u.id
    AND re.tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE rewards_earned
    ALTER COLUMN tenant_id SET NOT NULL;

-- Add index for tenant-scoped queries
CREATE INDEX idx_rewards_earned_tenant ON rewards_earned(tenant_id, user_id, created_at DESC);
