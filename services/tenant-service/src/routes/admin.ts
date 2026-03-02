import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import db from '../config/database';
import redis from '../config/redis';
import { logger } from '../config/logger';

export const adminRouter = Router();

// --- Validation Schemas ---
const createTenantSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  config: z.object({
    allowedYieldVehicles: z.array(z.string()).default(['hysa']),
    maxIdleCashSweepPct: z.number().min(0).max(100).default(80),
    defaultLiquidityThreshold: z.number().min(0).default(1000),
    rewardProgramIds: z.array(z.string()).default([]),
    kycProvider: z.enum(['persona', 'alloy', 'socure']).default('persona'),
    notificationChannels: z.array(z.enum(['push', 'email', 'sms'])).default(['push', 'email']),
  }).default({}),
  theme: z.object({
    primaryColor: z.string().default('#1a73e8'),
    secondaryColor: z.string().default('#34a853'),
    logoUrl: z.string().url().optional().default(''),
    faviconUrl: z.string().url().optional().default(''),
    fontFamily: z.string().default('Inter'),
    appName: z.string().default('NeoBank'),
  }).default({}),
  featureFlags: z.object({
    rewardsOptimization: z.boolean().default(true),
    idleCashSweep: z.boolean().default(true),
    behavioralLearning: z.boolean().default(true),
    cardRouting: z.boolean().default(true),
    investing: z.boolean().default(false),
    trading: z.boolean().default(false),
    lending: z.boolean().default(false),
  }).default({}),
});

// --- POST /admin/tenants ---
adminRouter.post('/tenants', async (req: Request, res: Response): Promise<void> => {
  try {
    const parsed = createTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const { name, slug, config, theme, featureFlags } = parsed.data;

    // Check slug uniqueness
    const existing = await db('tenants').where({ slug }).first();
    if (existing) {
      res.status(409).json({
        type: 'https://api.neobank.io/errors/conflict',
        title: 'Slug Already Exists',
        status: 409,
        detail: `A tenant with slug "${slug}" already exists.`,
      });
      return;
    }

    const tenantId = uuidv4();

    await db('tenants').insert({
      id: tenantId,
      name,
      slug,
      status: 'onboarding',
      config: JSON.stringify(config),
      theme: JSON.stringify(theme),
      feature_flags: JSON.stringify(featureFlags),
      created_at: new Date(),
      updated_at: new Date(),
    });

    logger.info('Tenant created', { tenantId, slug });

    res.status(201).json({
      success: true,
      data: {
        id: tenantId,
        name,
        slug,
        status: 'onboarding',
        config,
        theme,
        featureFlags,
      },
    });
  } catch (error) {
    logger.error('Failed to create tenant', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to create tenant.',
    });
  }
});

// --- GET /admin/tenants/:id ---
adminRouter.get('/tenants/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenant = await db('tenants').where({ id: req.params.id }).first();

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
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        config: tenant.config,
        theme: tenant.theme,
        featureFlags: tenant.feature_flags,
        createdAt: tenant.created_at,
        updatedAt: tenant.updated_at,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch tenant', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch tenant.',
    });
  }
});

// --- PATCH /admin/tenants/:id ---
adminRouter.patch('/tenants/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id;
    const updates: Record<string, unknown> = { updated_at: new Date() };

    if (req.body.name) updates.name = req.body.name;
    if (req.body.status) updates.status = req.body.status;
    if (req.body.config) updates.config = JSON.stringify(req.body.config);
    if (req.body.theme) updates.theme = JSON.stringify(req.body.theme);

    await db('tenants').where({ id: tenantId }).update(updates);

    // Invalidate cache
    await redis.del(tenantId);

    res.json({ success: true, data: { message: 'Tenant updated.' } });
  } catch (error) {
    logger.error('Failed to update tenant', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to update tenant.',
    });
  }
});

// --- PATCH /admin/tenants/:id/features ---
adminRouter.patch('/tenants/:id/features', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id;

    const existing = await db('tenants').where({ id: tenantId }).select('feature_flags').first();
    if (!existing) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Tenant Not Found',
        status: 404,
        detail: 'No tenant found with the given ID.',
      });
      return;
    }

    // Validate feature flag input using the same schema as POST /admin/tenants
    const featureFlagSchema = z.object({
      rewardsOptimization: z.boolean().optional(),
      idleCashSweep: z.boolean().optional(),
      behavioralLearning: z.boolean().optional(),
      cardRouting: z.boolean().optional(),
      investing: z.boolean().optional(),
      trading: z.boolean().optional(),
      lending: z.boolean().optional(),
    }).strict(); // strict() rejects unknown keys

    const parsed = featureFlagSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/validation',
        title: 'Validation Error',
        status: 400,
        detail: parsed.error.errors.map(e => `${e.path}: ${e.message}`).join(', '),
      });
      return;
    }

    const mergedFlags = { ...existing.feature_flags, ...parsed.data };

    await db('tenants').where({ id: tenantId }).update({
      feature_flags: JSON.stringify(mergedFlags),
      updated_at: new Date(),
    });

    // Invalidate cache
    await redis.del(tenantId);

    logger.info('Feature flags updated', { tenantId, flags: mergedFlags });

    res.json({ success: true, data: mergedFlags });
  } catch (error) {
    logger.error('Failed to update feature flags', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to update feature flags.',
    });
  }
});

// --- POST /admin/tenants/:id/theme ---
adminRouter.post('/tenants/:id/theme', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.params.id;

    await db('tenants').where({ id: tenantId }).update({
      theme: JSON.stringify(req.body),
      updated_at: new Date(),
    });

    await redis.del(tenantId);

    res.json({ success: true, data: { message: 'Theme updated.' } });
  } catch (error) {
    logger.error('Failed to update theme', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to update theme.',
    });
  }
});
