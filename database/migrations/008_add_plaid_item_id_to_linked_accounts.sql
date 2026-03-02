-- Migration: 008_add_plaid_item_id_to_linked_accounts
-- Description: Add plaid_item_id FK to linked_accounts for reliable item-to-account mapping
-- Fixes: disconnectItem cannot match accounts by encrypted token (random IV)

ALTER TABLE linked_accounts ADD COLUMN plaid_item_id UUID REFERENCES plaid_items(id);

CREATE INDEX idx_linked_accounts_plaid_item ON linked_accounts(plaid_item_id)
    WHERE plaid_item_id IS NOT NULL;
