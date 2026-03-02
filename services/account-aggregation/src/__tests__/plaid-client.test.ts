import { encryptAccessToken, decryptAccessToken, verifyWebhookSignature } from '../lib/plaid-client';

// Mock logger
jest.mock('../config/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Plaid Client', () => {
  describe('encryptAccessToken / decryptAccessToken', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      process.env.PLAID_TOKEN_ENCRYPTION_KEY = 'test-encryption-key-32-chars-xx';
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should encrypt and decrypt an access token correctly', () => {
      const token = 'access-sandbox-abc123def456';
      const encrypted = encryptAccessToken(token);
      const decrypted = decryptAccessToken(encrypted);

      expect(decrypted).toBe(token);
    });

    it('should produce different ciphertexts for same token (random IV)', () => {
      const token = 'access-sandbox-abc123def456';
      const encrypted1 = encryptAccessToken(token);
      const encrypted2 = encryptAccessToken(token);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle long access tokens', () => {
      const token = 'access-production-' + 'x'.repeat(200);
      const encrypted = encryptAccessToken(token);
      const decrypted = decryptAccessToken(encrypted);

      expect(decrypted).toBe(token);
    });

    it('should produce colon-separated format (iv:ciphertext)', () => {
      const token = 'access-sandbox-test';
      const encrypted = encryptAccessToken(token);

      expect(encrypted).toContain(':');
      const parts = encrypted.split(':');
      expect(parts.length).toBe(2);
      // IV should be 32 hex chars (16 bytes)
      expect(parts[0].length).toBe(32);
    });
  });

  describe('verifyWebhookSignature', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should allow unverified webhooks in sandbox mode', async () => {
      process.env.PLAID_ENV = 'sandbox';
      const result = await verifyWebhookSignature('{"test": true}', {});

      expect(result).toBe(true);
    });

    it('should reject missing verification header in production', async () => {
      process.env.PLAID_ENV = 'production';
      const result = await verifyWebhookSignature('{"test": true}', {});

      expect(result).toBe(false);
    });

    it('should reject JWT without valid kid/alg in header', async () => {
      // base64url of '{"alg":"none"}' = eyJhbGciOiJub25lIn0
      const fakeHeader = Buffer.from(JSON.stringify({alg: 'none'})).toString('base64url');
      const result = await verifyWebhookSignature('{"test": true}', {
        'plaid-verification': `${fakeHeader}.payload.signature`,
      });

      expect(result).toBe(false);
    });

    it('should reject invalid JWT format', async () => {
      const result = await verifyWebhookSignature('{"test": true}', {
        'plaid-verification': 'invalid-no-dots',
      });

      expect(result).toBe(false);
    });

    it('should reject JWT with wrong number of parts', async () => {
      const result = await verifyWebhookSignature('{"test": true}', {
        'plaid-verification': 'only.two',
      });

      expect(result).toBe(false);
    });
  });
});
