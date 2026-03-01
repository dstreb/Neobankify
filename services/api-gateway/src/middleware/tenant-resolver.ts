import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
}

declare global {
  namespace Express {
    interface Request {
      tenant?: TenantContext;
      userId?: string;
    }
  }
}

/**
 * Resolves tenant context from JWT claims or X-Tenant-ID header.
 * Tenant ID is validated against the tenant registry.
 */
export const tenantResolver = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip tenant resolution for health checks and external webhooks
    if (req.path.startsWith('/health') || req.path.startsWith('/v1/auth/kyc/webhook')) {
      next();
      return;
    }

    const tenantId = req.headers['x-tenant-id'] as string;

    if (!tenantId) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/missing-tenant',
        title: 'Missing Tenant ID',
        status: 400,
        detail: 'X-Tenant-ID header is required.',
      });
      return;
    }

    // TODO: Validate tenant ID against tenant registry (Redis cache -> DB fallback)
    // For now, accept any tenant ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/invalid-tenant',
        title: 'Invalid Tenant ID',
        status: 400,
        detail: 'X-Tenant-ID must be a valid UUID.',
      });
      return;
    }

    req.tenant = {
      tenantId,
      tenantSlug: '', // Will be resolved from tenant registry
    };

    next();
  } catch (error) {
    logger.error('Tenant resolution failed', { error });
    next(error);
  }
};
