import { Router, Request, Response } from 'express';
import db from '../config/database';
import redis from '../config/redis';
import { logger } from '../config/logger';

export const tenantRouter = Router();

// --- GET /tenants/config ---
// Returns the tenant config for the current tenant (from X-Tenant-ID header)
// Used by all services to load tenant-specific configuration
tenantRouter.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
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

    // Check Redis cache first
    const cached = await redis.get(tenantId);
    if (cached) {
      res.json({ success: true, data: JSON.parse(cached) });
      return;
    }

    // Fallback to database
    const tenant = await db('tenants').where({ id: tenantId }).first();

    if (!tenant) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Tenant Not Found',
        status: 404,
        detail: 'No tenant found with the given ID.',
      });
      return;
    }

    const tenantData = {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      status: tenant.status,
      config: tenant.config,
      theme: tenant.theme,
      featureFlags: tenant.feature_flags,
    };

    // Cache for 5 minutes
    await redis.set(tenantId, JSON.stringify(tenantData), 'EX', 300);

    res.json({ success: true, data: tenantData });
  } catch (error) {
    logger.error('Failed to fetch tenant config', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch tenant configuration.',
    });
  }
});

// --- GET /tenants/theme ---
// Returns only the theme config (for white-label rendering)
tenantRouter.get('/theme', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const tenant = await db('tenants')
      .where({ id: tenantId })
      .select('theme', 'name', 'slug')
      .first();

    if (!tenant) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Tenant Not Found',
        status: 404,
        detail: 'No tenant found with the given ID.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        name: tenant.name,
        slug: tenant.slug,
        ...tenant.theme,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch tenant theme', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch tenant theme.',
    });
  }
});

// --- GET /tenants/features ---
// Returns feature flags for the current tenant
tenantRouter.get('/features', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const tenant = await db('tenants')
      .where({ id: tenantId })
      .select('feature_flags')
      .first();

    if (!tenant) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Tenant Not Found',
        status: 404,
        detail: 'No tenant found with the given ID.',
      });
      return;
    }

    res.json({ success: true, data: tenant.feature_flags });
  } catch (error) {
    logger.error('Failed to fetch feature flags', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch feature flags.',
    });
  }
});
