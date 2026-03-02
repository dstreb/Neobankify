import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { NO_AUTH_NO_TENANT_PATHS } from '../config/paths';

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
    // Skip tenant resolution for paths that need neither auth nor tenant context.
    // Paths are defined in config/paths.ts (single source of truth shared with auth middleware).
    if (NO_AUTH_NO_TENANT_PATHS.some(p => req.path === p || req.path === p + '/')) {
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
    // Use raw tenantId as cache key — the gateway Redis client has keyPrefix:'gw-tenant:'
    // (separate from the tenant-service's 'tenant:' prefix) to avoid cache format collisions.
    // The gateway caches plain slug strings; the tenant-service caches full JSON config objects.
    const cacheKey = tenantId;

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

    // If neither Redis nor DB could validate the tenant, reject the request
    if (!tenantSlug) {
      res.status(503).json({
        type: 'https://api.neobank.io/errors/service-unavailable',
        title: 'Service Unavailable',
        status: 503,
        detail: 'Unable to validate tenant. Please try again later.',
      });
      return;
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
