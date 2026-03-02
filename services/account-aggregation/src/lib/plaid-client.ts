/**
 * Plaid API Client Wrapper
 *
 * Provides a tenant-aware Plaid client that handles:
 * - Link token creation for Plaid Link flow
 * - Public token exchange for access tokens
 * - Account fetching and balance refresh
 * - Transaction sync (cursor-based)
 * - Webhook verification
 * - Item management (error handling, re-auth)
 */
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
  ItemPublicTokenExchangeRequest,
  LinkTokenCreateRequest,
  TransactionsSyncRequest,
  AccountsGetRequest,
  ItemGetRequest,
  ItemRemoveRequest,
} from 'plaid';
import { logger } from '../config/logger';
import crypto from 'crypto';

export interface PlaidTenantConfig {
  clientId: string;
  secret: string;
  environment: 'sandbox' | 'development' | 'production';
  webhookUrl: string;
  products: string[];
  countryCodes: string[];
}

const DEFAULT_CONFIG: PlaidTenantConfig = {
  clientId: process.env.PLAID_CLIENT_ID || '',
  secret: process.env.PLAID_SECRET || '',
  environment: (process.env.PLAID_ENV as PlaidTenantConfig['environment']) || 'sandbox',
  webhookUrl: process.env.PLAID_WEBHOOK_URL || 'https://api.neobank.io/webhooks/plaid',
  products: ['transactions', 'auth', 'identity'],
  countryCodes: ['US'],
};

const ENV_MAP: Record<string, string> = {
  sandbox: PlaidEnvironments.sandbox,
  development: PlaidEnvironments.development,
  production: PlaidEnvironments.production,
};

/**
 * Create a Plaid API client for a specific tenant.
 * In production, tenant-specific Plaid credentials would be stored
 * encrypted in the tenant config table.
 */
export function createPlaidClient(tenantConfig?: Partial<PlaidTenantConfig>): PlaidApi {
  const config = { ...DEFAULT_CONFIG, ...tenantConfig };

  const configuration = new Configuration({
    basePath: ENV_MAP[config.environment] || PlaidEnvironments.sandbox,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': config.clientId,
        'PLAID-SECRET': config.secret,
      },
    },
  });

  return new PlaidApi(configuration);
}

/**
 * Create a Link token for the Plaid Link frontend component.
 */
export async function createLinkToken(
  client: PlaidApi,
  params: {
    userId: string;
    tenantConfig: PlaidTenantConfig;
    accessToken?: string; // For update mode (re-auth)
  },
): Promise<{ linkToken: string; expiration: string }> {
  const request: LinkTokenCreateRequest = {
    user: { client_user_id: params.userId },
    client_name: 'Neobankify',
    products: params.accessToken
      ? undefined // Update mode doesn't need products
      : params.tenantConfig.products.map((p) => p as Products),
    country_codes: params.tenantConfig.countryCodes.map((c) => c as CountryCode),
    language: 'en',
    webhook: params.tenantConfig.webhookUrl,
    access_token: params.accessToken,
  };

  const response = await client.linkTokenCreate(request);
  logger.info('Link token created', { userId: params.userId });

  return {
    linkToken: response.data.link_token,
    expiration: response.data.expiration,
  };
}

/**
 * Exchange a public token (from Plaid Link) for an access token.
 */
export async function exchangePublicToken(
  client: PlaidApi,
  publicToken: string,
): Promise<{ accessToken: string; itemId: string }> {
  const request: ItemPublicTokenExchangeRequest = {
    public_token: publicToken,
  };

  const response = await client.itemPublicTokenExchange(request);
  logger.info('Public token exchanged', { itemId: response.data.item_id });

  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
}

/**
 * Fetch all accounts for a given access token.
 */
export async function getAccounts(
  client: PlaidApi,
  accessToken: string,
): Promise<Array<{
  accountId: string;
  name: string;
  officialName: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  currentBalance: number | null;
  availableBalance: number | null;
  limit: number | null;
  isoCurrencyCode: string | null;
}>> {
  const request: AccountsGetRequest = { access_token: accessToken };
  const response = await client.accountsGet(request);

  return response.data.accounts.map((account) => ({
    accountId: account.account_id,
    name: account.name,
    officialName: account.official_name,
    type: account.type,
    subtype: account.subtype,
    mask: account.mask,
    currentBalance: account.balances.current,
    availableBalance: account.balances.available,
    limit: account.balances.limit,
    isoCurrencyCode: account.balances.iso_currency_code,
  }));
}

/**
 * Sync transactions using cursor-based pagination.
 * Returns added, modified, and removed transactions.
 */
export async function syncTransactions(
  client: PlaidApi,
  accessToken: string,
  cursor?: string,
): Promise<{
  added: Array<{
    transactionId: string;
    accountId: string;
    amount: number;
    date: string;
    name: string;
    merchantName: string | null;
    category: string[];
    categoryId: string | null;
    personalFinanceCategory: { primary: string; detailed: string } | null;
    pending: boolean;
    paymentChannel: string;
    isoCurrencyCode: string | null;
  }>;
  modified: Array<{
    transactionId: string;
    accountId: string;
    amount: number;
    date: string;
    name: string;
    merchantName: string | null;
    pending: boolean;
  }>;
  removed: Array<{ transactionId: string }>;
  nextCursor: string;
  hasMore: boolean;
}> {
  const allAdded: Array<ReturnType<typeof mapTransaction>> = [];
  const allModified: Array<{
    transactionId: string;
    accountId: string;
    amount: number;
    date: string;
    name: string;
    merchantName: string | null;
    pending: boolean;
  }> = [];
  const allRemoved: Array<{ transactionId: string }> = [];
  let nextCursor = cursor || '';
  let hasMore = true;

  while (hasMore) {
    const request: TransactionsSyncRequest = {
      access_token: accessToken,
      cursor: nextCursor || undefined,
      count: 500,
    };

    const response = await client.transactionsSync(request);
    const data = response.data;

    allAdded.push(...data.added.map((t) => mapTransaction(t as unknown as Record<string, unknown>)));
    allModified.push(
      ...data.modified.map((t) => ({
        transactionId: t.transaction_id,
        accountId: t.account_id,
        amount: t.amount,
        date: t.date,
        name: t.name,
        merchantName: t.merchant_name ?? null,
        pending: t.pending,
      })),
    );
    allRemoved.push(
      ...data.removed
        .filter((t): t is { transaction_id: string } => t.transaction_id != null)
        .map((t) => ({ transactionId: t.transaction_id })),
    );

    nextCursor = data.next_cursor;
    hasMore = data.has_more;
  }

  logger.info('Transaction sync complete', {
    added: allAdded.length,
    modified: allModified.length,
    removed: allRemoved.length,
  });

  return {
    added: allAdded,
    modified: allModified,
    removed: allRemoved,
    nextCursor,
    hasMore: false,
  };
}

function mapTransaction(t: Record<string, unknown>) {
  return {
    transactionId: t.transaction_id as string,
    accountId: t.account_id as string,
    amount: t.amount as number,
    date: t.date as string,
    name: t.name as string,
    merchantName: (t.merchant_name as string | null | undefined) ?? null,
    category: (t.category as string[] | null) || [],
    categoryId: (t.category_id as string | null) ?? null,
    personalFinanceCategory: (t.personal_finance_category as { primary: string; detailed: string } | null) ?? null,
    pending: t.pending as boolean,
    paymentChannel: t.payment_channel as string,
    isoCurrencyCode: (t.iso_currency_code as string | null) ?? null,
  };
}

/**
 * Get item status and error information.
 */
export async function getItemStatus(
  client: PlaidApi,
  accessToken: string,
): Promise<{
  itemId: string;
  institutionId: string | null;
  consentExpirationTime: string | null;
  updateType: string;
  error: { errorType: string; errorCode: string; errorMessage: string } | null;
}> {
  const request: ItemGetRequest = { access_token: accessToken };
  const response = await client.itemGet(request);
  const item = response.data.item;

  return {
    itemId: item.item_id,
    institutionId: item.institution_id ?? null,
    consentExpirationTime: item.consent_expiration_time ?? null,
    updateType: item.update_type ?? 'background',
    error: response.data.status?.transactions?.last_failed_update
      ? {
          errorType: 'TRANSACTIONS_ERROR',
          errorCode: 'SYNC_FAILED',
          errorMessage: 'Transaction sync has failed',
        }
      : null,
  };
}

/**
 * Remove a Plaid item (revoke access token).
 */
export async function removeItem(
  client: PlaidApi,
  accessToken: string,
): Promise<void> {
  const request: ItemRemoveRequest = { access_token: accessToken };
  await client.itemRemove(request);
  logger.info('Plaid item removed');
}

/**
 * Verify a Plaid webhook signature using JWT verification.
 * Plaid signs webhooks with a JWS (JSON Web Signature) using RS256.
 * The public key is fetched from Plaid's /webhook_verification_key/get endpoint.
 *
 * Flow:
 * 1. Decode the JWT header to get the key ID (kid)
 * 2. Fetch the public key from Plaid using the kid
 * 3. Verify the JWT signature using the public key
 * 4. Compare the SHA-256 hash of the request body with the claim in the JWT
 */
export async function verifyWebhookSignature(
  body: string,
  headers: Record<string, string>,
  plaidClient?: PlaidApi,
): Promise<boolean> {
  const plaidVerification = headers['plaid-verification'];
  if (!plaidVerification) {
    logger.warn('Missing Plaid verification header');
    // In sandbox mode, allow unverified webhooks
    if (process.env.PLAID_ENV === 'sandbox') {
      return true;
    }
    return false;
  }

  try {
    // 1. Decode the JWT header to extract the key ID (kid)
    const parts = plaidVerification.split('.');
    if (parts.length !== 3) {
      logger.warn('Invalid Plaid verification JWT format');
      return false;
    }

    const headerJson = Buffer.from(parts[0], 'base64url').toString('utf8');
    const header = JSON.parse(headerJson);

    if (!header.kid || header.alg !== 'ES256') {
      logger.warn('Invalid Plaid JWT header', { alg: header.alg, kid: header.kid });
      return false;
    }

    // 2. Fetch the public key from Plaid using the kid
    if (!plaidClient) {
      logger.warn('No Plaid client provided for webhook verification — cannot fetch key');
      // In sandbox mode, allow if we can't verify
      if (process.env.PLAID_ENV === 'sandbox') {
        return true;
      }
      return false;
    }

    const keyResponse = await plaidClient.webhookVerificationKeyGet({
      key_id: header.kid,
    });

    const jwk = keyResponse.data.key;

    // 3. Import the JWK and verify the JWT signature
    // Cast Plaid's JWKPublicKey to JsonWebKey for Node's crypto module
    // Plaid's JWKPublicKey type lacks an index signature but is structurally compatible
    const keyObject = crypto.createPublicKey({ key: jwk as unknown as crypto.JsonWebKey, format: 'jwk' });

    // Verify signature: sign(header.payload) should match the signature part
    const signatureInput = `${parts[0]}.${parts[1]}`;
    const signature = Buffer.from(parts[2], 'base64url');

    const isValid = crypto.verify(
      'sha256',
      Buffer.from(signatureInput),
      { key: keyObject, dsaEncoding: 'ieee-p1363' },
      signature,
    );

    if (!isValid) {
      logger.warn('Plaid webhook JWT signature verification failed');
      return false;
    }

    // 4. Verify the request body hash matches the claim
    const payloadJson = Buffer.from(parts[1], 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    const bodyHash = crypto.createHash('sha256').update(body).digest('hex');
    if (payload.request_body_sha256 !== bodyHash) {
      logger.warn('Plaid webhook body hash mismatch', {
        expected: payload.request_body_sha256,
        actual: bodyHash,
      });
      return false;
    }

    // 5. Check token is not expired (iat should be within 5 minutes)
    if (payload.iat) {
      const now = Date.now() / 1000;
      const age = now - payload.iat;
      if (age > 300 || age < -30) {
        logger.warn('Plaid webhook JWT expired or has future iat', { ageSeconds: age });
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Webhook signature verification failed', {
      error: (error as Error).message,
    });
    return false;
  }
}

/**
 * Encrypt an access token for storage.
 * In production, use AWS KMS or similar.
 */
export function encryptAccessToken(accessToken: string): string {
  const rawKey = process.env.PLAID_TOKEN_ENCRYPTION_KEY || 'dev-encryption-key-32-chars-long!';
  // Derive a proper 32-byte key using SHA-256 hash to handle any key length/encoding
  const encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', encryptionKey, iv);
  let encrypted = cipher.update(accessToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt an access token from storage.
 */
export function decryptAccessToken(encryptedToken: string): string {
  const rawKey = process.env.PLAID_TOKEN_ENCRYPTION_KEY || 'dev-encryption-key-32-chars-long!';
  // Derive a proper 32-byte key using SHA-256 hash to handle any key length/encoding
  const encryptionKey = crypto.createHash('sha256').update(rawKey).digest();
  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', encryptionKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
