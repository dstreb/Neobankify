import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../config/logger';

interface JwtPayload {
  sub: string;
  tenant_id: string;
  email: string;
  roles: string[];
  iat: number;
  exp: number;
}

const PUBLIC_PATHS = [
  '/health',
  '/v1/auth/register',
  '/v1/auth/login',
  '/v1/auth/refresh',
  '/v1/auth/kyc/webhook',
  '/v1/webhooks/plaid',
];

/**
 * Validates JWT tokens and extracts user identity.
 * Uses RS256 with public key from JWKS endpoint (Auth0/Cognito).
 */
export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Skip auth for public paths (exact match only to prevent prefix-based bypass)
  if (PUBLIC_PATHS.some(path => req.path === path)) {
    next();
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      type: 'https://api.neobank.io/errors/unauthorized',
      title: 'Unauthorized',
      status: 401,
      detail: 'Missing or invalid Authorization header. Expected: Bearer <token>',
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    // TODO: In production, verify against JWKS endpoint (Auth0/Cognito)
    // For development, use symmetric secret
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    // Validate tenant ID matches JWT claim
    if (req.tenant && decoded.tenant_id !== req.tenant.tenantId) {
      res.status(403).json({
        type: 'https://api.neobank.io/errors/tenant-mismatch',
        title: 'Forbidden',
        status: 403,
        detail: 'JWT tenant claim does not match X-Tenant-ID header.',
      });
      return;
    }

    req.userId = decoded.sub;
    req.headers['x-user-id'] = decoded.sub;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        type: 'https://api.neobank.io/errors/token-expired',
        title: 'Token Expired',
        status: 401,
        detail: 'Access token has expired. Use refresh token to obtain a new one.',
      });
      return;
    }

    logger.warn('JWT validation failed', { error: (error as Error).message });
    res.status(401).json({
      type: 'https://api.neobank.io/errors/invalid-token',
      title: 'Invalid Token',
      status: 401,
      detail: 'The provided token is invalid.',
    });
  }
};
