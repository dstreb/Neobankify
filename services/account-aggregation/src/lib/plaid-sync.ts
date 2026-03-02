/**
 * Plaid Sync Service
 *
 * Manages the full lifecycle of syncing accounts and transactions from Plaid:
 * - Initial account setup after Link completion
 * - Incremental transaction sync (cursor-based)
 * - Balance refresh
 * - Error recovery and re-authentication
 */
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';
import {
  createPlaidClient,
  exchangePublicToken,
  getAccounts,
  syncTransactions,
  encryptAccessToken,
  decryptAccessToken,
  removeItem,
  PlaidTenantConfig,
} from './plaid-client';

const DEFAULT_TENANT_CONFIG: PlaidTenantConfig = {
  clientId: process.env.PLAID_CLIENT_ID || '',
  secret: process.env.PLAID_SECRET || '',
  environment: (process.env.PLAID_ENV as PlaidTenantConfig['environment']) || 'sandbox',
  webhookUrl: process.env.PLAID_WEBHOOK_URL || 'https://api.neobank.io/webhooks/plaid',
  products: ['transactions', 'auth'],
  countryCodes: ['US'],
};

/**
 * Handle the complete flow after a user completes Plaid Link:
 * 1. Exchange public token for access token
 * 2. Store the Plaid item
 * 3. Fetch and store all accounts
 * 4. Trigger initial transaction sync
 */
export async function handleLinkCompletion(params: {
  userId: string;
  tenantId: string;
  publicToken: string;
  institutionId: string;
  institutionName: string;
  tenantConfig?: Partial<PlaidTenantConfig>;
}): Promise<{
  itemId: string;
  accounts: Array<{ id: string; type: string; mask: string | null; name: string }>;
}> {
  const config = { ...DEFAULT_TENANT_CONFIG, ...params.tenantConfig };
  const client = createPlaidClient(config);

  // 1. Exchange public token
  const { accessToken, itemId } = await exchangePublicToken(client, params.publicToken);

  // 2. Store the Plaid item
  const plaidItemId = uuidv4();
  await db('plaid_items').insert({
    id: plaidItemId,
    tenant_id: params.tenantId,
    user_id: params.userId,
    plaid_item_id: itemId,
    access_token_encrypted: encryptAccessToken(accessToken),
    institution_id: params.institutionId,
    institution_name: params.institutionName,
    sync_cursor: null,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
  });

  // 3. Fetch and store all accounts
  const plaidAccounts = await getAccounts(client, accessToken);
  const storedAccounts: Array<{ id: string; type: string; mask: string | null; name: string }> = [];

  for (const acct of plaidAccounts) {
    const accountId = uuidv4();
    const accountType = mapPlaidAccountType(acct.type, acct.subtype);

    await db('linked_accounts').insert({
      id: accountId,
      user_id: params.userId,
      plaid_item_id: plaidItemId,
      provider: 'plaid',
      provider_account_id: acct.accountId,
      access_token_encrypted: encryptAccessToken(accessToken),
      account_type: accountType,
      institution_name: params.institutionName,
      mask: acct.mask,
      current_balance: acct.currentBalance || 0,
      available_balance: acct.availableBalance || 0,
      credit_limit: acct.limit,
      currency: acct.isoCurrencyCode || 'USD',
      last_synced_at: new Date(),
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    storedAccounts.push({
      id: accountId,
      type: accountType,
      mask: acct.mask,
      name: acct.name,
    });
  }

  logger.info('Link completion handled', {
    userId: params.userId,
    itemId,
    accountCount: storedAccounts.length,
  });

  return { itemId, accounts: storedAccounts };
}

/**
 * Sync transactions for a Plaid item using cursor-based pagination.
 * This handles initial sync and incremental updates.
 */
export async function syncItemTransactions(params: {
  plaidItemDbId: string;
  tenantId: string;
  tenantConfig?: Partial<PlaidTenantConfig>;
}): Promise<{ added: number; modified: number; removed: number }> {
  const config = { ...DEFAULT_TENANT_CONFIG, ...params.tenantConfig };
  const client = createPlaidClient(config);

  // Get item from DB
  const item = await db('plaid_items')
    .where({ id: params.plaidItemDbId, tenant_id: params.tenantId, status: 'active' })
    .first();

  if (!item) {
    throw new Error(`Plaid item not found: ${params.plaidItemDbId}`);
  }

  const accessToken = decryptAccessToken(item.access_token_encrypted);

  // Sync transactions
  const result = await syncTransactions(client, accessToken, item.sync_cursor || undefined);

  // Get account mapping (Plaid account ID -> our account ID)
  const accounts = await db('linked_accounts')
    .where({ user_id: item.user_id, provider: 'plaid', status: 'active' })
    .select('id', 'provider_account_id');

  const accountMap = new Map(accounts.map((a: { id: string; provider_account_id: string }) => [a.provider_account_id, a.id]));

  // Process added transactions
  for (const txn of result.added) {
    const accountId = accountMap.get(txn.accountId);
    if (!accountId) {
      logger.warn('Account not found for transaction', { plaidAccountId: txn.accountId });
      continue;
    }

    await db('transactions')
      .insert({
        id: uuidv4(),
        user_id: item.user_id,
        tenant_id: params.tenantId,
        account_id: accountId,
        provider_transaction_id: txn.transactionId,
        // Plaid: positive = money leaving account (debit), negative = money entering (credit/refund)
        // Store with sign preserved so downstream consumers can distinguish debits from credits
        amount: txn.amount,
        merchant_name: txn.merchantName || txn.name,
        mcc_code: null, // MCC not directly available from transactions/sync
        category: txn.personalFinanceCategory?.primary || txn.category[0] || null,
        subcategory: txn.personalFinanceCategory?.detailed || txn.category[1] || null,
        transaction_date: txn.date,
        status: txn.pending ? 'pending' : 'posted',
        created_at: new Date(),
        updated_at: new Date(),
      })
      .onConflict(db.raw('(provider_transaction_id) WHERE provider_transaction_id IS NOT NULL'))
      .ignore(); // Skip duplicates
  }

  // Process modified transactions
  for (const txn of result.modified) {
    await db('transactions')
      .where({ provider_transaction_id: txn.transactionId, tenant_id: params.tenantId })
      .update({
        amount: txn.amount,
        merchant_name: txn.merchantName || txn.name,
        status: txn.pending ? 'pending' : 'posted',
        updated_at: new Date(),
      });
  }

  // Process removed transactions
  for (const txn of result.removed) {
    await db('transactions')
      .where({ provider_transaction_id: txn.transactionId, tenant_id: params.tenantId })
      .update({ status: 'cancelled', updated_at: new Date() });
  }

  // Update sync cursor
  await db('plaid_items')
    .where({ id: params.plaidItemDbId })
    .update({
      sync_cursor: result.nextCursor,
      last_synced_at: new Date(),
      updated_at: new Date(),
    });

  logger.info('Transaction sync complete', {
    itemId: params.plaidItemDbId,
    added: result.added.length,
    modified: result.modified.length,
    removed: result.removed.length,
  });

  return {
    added: result.added.length,
    modified: result.modified.length,
    removed: result.removed.length,
  };
}

/**
 * Refresh balances for all accounts linked to a Plaid item.
 */
export async function refreshBalances(params: {
  plaidItemDbId: string;
  tenantId: string;
  tenantConfig?: Partial<PlaidTenantConfig>;
}): Promise<number> {
  const config = { ...DEFAULT_TENANT_CONFIG, ...params.tenantConfig };
  const client = createPlaidClient(config);

  const item = await db('plaid_items')
    .where({ id: params.plaidItemDbId, tenant_id: params.tenantId, status: 'active' })
    .first();

  if (!item) {
    throw new Error(`Plaid item not found: ${params.plaidItemDbId}`);
  }

  const accessToken = decryptAccessToken(item.access_token_encrypted);
  const plaidAccounts = await getAccounts(client, accessToken);

  let updated = 0;
  for (const acct of plaidAccounts) {
    const result = await db('linked_accounts')
      .where({ provider_account_id: acct.accountId, user_id: item.user_id, status: 'active' })
      .update({
        current_balance: acct.currentBalance || 0,
        available_balance: acct.availableBalance || 0,
        credit_limit: acct.limit,
        last_synced_at: new Date(),
        updated_at: new Date(),
      });
    if (result > 0) updated++;
  }

  logger.info('Balances refreshed', { itemId: params.plaidItemDbId, updated });
  return updated;
}

/**
 * Disconnect a Plaid item: revoke access token and mark accounts as disconnected.
 */
export async function disconnectItem(params: {
  plaidItemDbId: string;
  userId: string;
  tenantId: string;
  tenantConfig?: Partial<PlaidTenantConfig>;
}): Promise<void> {
  const config = { ...DEFAULT_TENANT_CONFIG, ...params.tenantConfig };
  const client = createPlaidClient(config);

  const item = await db('plaid_items')
    .where({ id: params.plaidItemDbId, user_id: params.userId, tenant_id: params.tenantId })
    .first();

  if (!item) {
    throw new Error(`Plaid item not found: ${params.plaidItemDbId}`);
  }

  // Revoke the access token at Plaid
  try {
    const accessToken = decryptAccessToken(item.access_token_encrypted);
    await removeItem(client, accessToken);
  } catch (error) {
    logger.warn('Failed to revoke Plaid access token', { error: (error as Error).message });
    // Continue with local cleanup even if Plaid revocation fails
  }

  // Mark item as disconnected
  await db('plaid_items')
    .where({ id: params.plaidItemDbId })
    .update({ status: 'disconnected', updated_at: new Date() });

  // Mark all linked accounts belonging to this Plaid item as disconnected
  await db('linked_accounts')
    .where({ plaid_item_id: params.plaidItemDbId, user_id: params.userId, status: 'active' })
    .update({ status: 'disconnected', updated_at: new Date() });

  logger.info('Plaid item disconnected', { itemId: params.plaidItemDbId, userId: params.userId });
}

/**
 * Map Plaid account types to our schema types.
 */
function mapPlaidAccountType(type: string, subtype: string | null): string {
  const typeMap: Record<string, string> = {
    depository: subtype === 'savings' ? 'savings' : 'checking',
    credit: 'credit',
    investment: 'investment',
    loan: 'loan',
    mortgage: 'mortgage',
  };
  return typeMap[type] || 'checking';
}
