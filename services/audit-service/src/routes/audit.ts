import { Router, Request, Response } from 'express';
import db from '../config/database';
import { logger } from '../config/logger';

export const auditRouter = Router();

// --- GET /audit ---
// Query audit log entries (admin-only, filtered by tenant)
auditRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 200);
    const cursor = req.query.cursor as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const action = req.query.action as string | undefined;
    const userId = req.query.userId as string | undefined;

    let query = db('audit_log')
      .where({ tenant_id: tenantId })
      .orderBy('created_at', 'desc')
      .limit(limit + 1);

    if (cursor) query = query.where('created_at', '<', cursor);
    if (entityType) query = query.where({ entity_type: entityType });
    if (action) query = query.where({ action });
    if (userId) query = query.where({ user_id: userId });

    const rows = await query;
    const hasMore = rows.length > limit;
    const data = rows.slice(0, limit);

    res.json({
      success: true,
      data: data.map(r => ({
        id: r.id,
        eventType: r.event_type,
        entityType: r.entity_type,
        entityId: r.entity_id,
        actorType: r.actor_type,
        actorId: r.actor_id,
        action: r.action,
        beforeState: r.before_state ? JSON.parse(r.before_state) : null,
        afterState: r.after_state ? JSON.parse(r.after_state) : null,
        correlationId: r.correlation_id,
        source: r.source,
        createdAt: r.created_at,
      })),
      meta: {
        cursor: hasMore ? data[data.length - 1].created_at : null,
        hasMore,
      },
    });
  } catch (error) {
    logger.error('Failed to query audit log', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to query audit log.',
    });
  }
});

// --- GET /audit/:id ---
auditRouter.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const entry = await db('audit_log')
      .where({ id: req.params.id, tenant_id: tenantId })
      .first();

    if (!entry) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Audit Entry Not Found',
        status: 404,
        detail: 'Audit entry not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: entry.id,
        eventType: entry.event_type,
        entityType: entry.entity_type,
        entityId: entry.entity_id,
        actorType: entry.actor_type,
        actorId: entry.actor_id,
        action: entry.action,
        beforeState: entry.before_state ? JSON.parse(entry.before_state) : null,
        afterState: entry.after_state ? JSON.parse(entry.after_state) : null,
        correlationId: entry.correlation_id,
        source: entry.source,
        createdAt: entry.created_at,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch audit entry', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch audit entry.',
    });
  }
});
