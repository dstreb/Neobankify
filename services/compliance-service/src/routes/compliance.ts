import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database';
import { logger } from '../config/logger';

export const complianceRouter = Router();

// --- GET /compliance/alerts ---
complianceRouter.get('/alerts', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;
    const status = req.query.status as string || 'open';
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 200);

    const alerts = await db('compliance_alerts')
      .where({ tenant_id: tenantId, status })
      .orderBy('created_at', 'desc')
      .limit(limit);

    res.json({
      success: true,
      data: alerts.map(a => ({
        id: a.id,
        alertType: a.alert_type,
        severity: a.severity,
        ruleTriggered: a.rule_triggered,
        userId: a.user_id,
        description: a.description,
        status: a.status,
        resolvedBy: a.resolved_by,
        resolvedAt: a.resolved_at,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch compliance alerts', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch compliance alerts.',
    });
  }
});

// --- POST /compliance/alerts/:id/resolve ---
complianceRouter.post('/alerts/:id/resolve', async (req: Request, res: Response): Promise<void> => {
  try {
    const actorId = req.headers['x-user-id'] as string;
    const { resolution, notes } = req.body;

    const tenantId = req.headers['x-tenant-id'] as string;

    const updated = await db('compliance_alerts')
      .where({ id: req.params.id, tenant_id: tenantId })
      .update({
        status: 'resolved',
        resolution,
        notes,
        resolved_by: actorId,
        resolved_at: new Date(),
      });

    if (updated === 0) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'Alert Not Found',
        status: 404,
        detail: 'Compliance alert not found.',
      });
      return;
    }

    res.json({ success: true, data: { message: 'Alert resolved.' } });
  } catch (error) {
    logger.error('Failed to resolve alert', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to resolve compliance alert.',
    });
  }
});

// --- GET /compliance/rules ---
complianceRouter.get('/rules', async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = req.headers['x-tenant-id'] as string;

    const rules = await db('compliance_rules')
      .where({ tenant_id: tenantId, is_active: true })
      .orderBy('severity', 'desc');

    res.json({
      success: true,
      data: rules.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        ruleType: r.rule_type,
        severity: r.severity,
        threshold: r.threshold,
        isActive: r.is_active,
      })),
    });
  } catch (error) {
    logger.error('Failed to fetch compliance rules', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch compliance rules.',
    });
  }
});
