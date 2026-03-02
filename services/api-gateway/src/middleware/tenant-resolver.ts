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
    if (req.path.startsWith('/health') || req.path === '/v1/auth/kyc/webhook') {
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

    // Validate tenant ID format (UUID)
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

    // Validate tenant exists in the database
    // Uses Redis cache with DB fallback for performance
    const redis = req.app.locals.redis;
    let tenantSlug = '';
    const cacheKey = `tenant:${tenantId}`;

    if (redis) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          tenantSlug = cached;
        }
      } catch {
        // Redis unavailable, fall through to DB
      }
    }

    if (!tenantSlug) {
      // DB fallback: validate tenant exists and is active
      const knex = req.app.locals.db;
      if (knex) {
        const tenant = await knex('tenants')
          .where({ id: tenantId, status: 'active' })
          .select('slug')
          .first();

        if (!tenant) {
          res.status(400).json({
            type: 'https://api.neobank.io/errors/invalid-tenant',
            title: 'Invalid Tenant',
            status: 400,
            detail: 'Tenant not found or is not active.',
          });
          return;
        }

        tenantSlug = tenant.slug;

        // Cache for 5 minutes
        if (redis) {
          redis.set(cacheKey, tenantSlug, 'EX', 300).catch(() => {});
        }
      }
    }

    req.tenant = {
      tenantId,
      tenantSlug,
    };

    next();
  } catch (error) {
    logger.error('Tenant resolution failed', { error });
    next(error);
  }
};
