/**
 * Shared public path definitions for the API gateway.
 *
 * Both the auth middleware and tenant resolver reference these lists so that
 * skip-path logic stays in sync. Adding a path here automatically updates
 * both middlewares — no need to maintain two separate lists.
 */

/**
 * Paths that skip BOTH auth AND tenant resolution.
 * These are external-facing endpoints that receive unauthenticated,
 * tenant-less requests (health checks, third-party webhooks).
 */
export const NO_AUTH_NO_TENANT_PATHS = [
  '/health',
  '/v1/auth/kyc/webhook',
  '/v1/webhooks/plaid',
];

/**
 * Paths that skip auth but STILL require tenant resolution.
 * These are unauthenticated user-facing endpoints (register, login, refresh)
 * that need tenant context to scope the operation.
 */
export const NO_AUTH_WITH_TENANT_PATHS = [
  '/v1/auth/register',
  '/v1/auth/login',
  '/v1/auth/refresh',
];

/**
 * All paths that skip authentication (union of both lists).
 * Used by the auth middleware.
 */
export const PUBLIC_PATHS = [
  ...NO_AUTH_NO_TENANT_PATHS,
  ...NO_AUTH_WITH_TENANT_PATHS,
];
