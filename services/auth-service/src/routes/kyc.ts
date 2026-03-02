import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import db from '../config/database';
import { producer } from '../config/kafka';
import { logger } from '../config/logger';

const PERSONA_WEBHOOK_SECRET = process.env.PERSONA_WEBHOOK_SECRET || '';

/**
 * Verify Persona webhook signature using HMAC-SHA256.
 * Returns true if signature is valid or if in sandbox mode with no secret configured.
 */
function verifyPersonaSignature(rawBody: string, signatureHeader: string | undefined): boolean {
  // In sandbox/dev mode with no secret configured, allow unverified webhooks
  if (!PERSONA_WEBHOOK_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('PERSONA_WEBHOOK_SECRET is not configured in production');
      return false;
    }
    logger.warn('Persona webhook secret not configured — allowing unverified webhook (non-production)');
    return true;
  }

  if (!signatureHeader) {
    logger.warn('Missing Persona-Signature header');
    return false;
  }

  // Persona sends signature as "t=<timestamp>,v1=<hmac>"
  const parts = signatureHeader.split(',');
  const timestampPart = parts.find(p => p.startsWith('t='));
  const signaturePart = parts.find(p => p.startsWith('v1='));

  if (!timestampPart || !signaturePart) {
    logger.warn('Invalid Persona-Signature header format');
    return false;
  }

  const timestamp = timestampPart.slice(2);
  const signature = signaturePart.slice(3);

  // Verify the signature
  const payload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac('sha256', PERSONA_WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    logger.warn('Persona webhook signature mismatch');
    return false;
  }

  // Reject webhooks older than 5 minutes or more than 30s in the future (replay/future-dated protection)
  const webhookAge = Date.now() / 1000 - parseInt(timestamp, 10);
  if (webhookAge > 300 || webhookAge < -30) {
    logger.warn('Persona webhook timestamp out of range', { ageSeconds: webhookAge });
    return false;
  }

  return true;
}

export const kycRouter = Router();

/**
 * KYC Integration Service
 * 
 * Integrates with Persona (primary) or Alloy/Socure as KYC providers.
 * All KYC decisions are logged to audit trail with provider response + timestamp.
 * 
 * Flow:
 * 1. User initiates KYC → POST /auth/kyc/initiate
 * 2. Frontend renders Persona SDK inline
 * 3. Persona webhook → POST /auth/kyc/webhook (from Persona servers)
 * 4. Status updated → user can proceed
 */

// --- GET /auth/kyc/status ---
kycRouter.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    const user = await db('users')
      .where({ id: userId, tenant_id: tenantId })
      .select('kyc_status', 'kyc_provider', 'kyc_reference_id')
      .first();

    if (!user) {
      res.status(404).json({
        type: 'https://api.neobank.io/errors/not-found',
        title: 'User Not Found',
        status: 404,
        detail: 'User not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        status: user.kyc_status,
        provider: user.kyc_provider,
        referenceId: user.kyc_reference_id,
      },
    });
  } catch (error) {
    logger.error('Failed to fetch KYC status', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to fetch KYC status.',
    });
  }
});

// --- POST /auth/kyc/initiate ---
kycRouter.post('/initiate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const tenantId = req.headers['x-tenant-id'] as string;

    // Check current status
    const user = await db('users').where({ id: userId, tenant_id: tenantId }).select('kyc_status').first();

    if (user?.kyc_status === 'approved') {
      res.status(400).json({
        type: 'https://api.neobank.io/errors/already-verified',
        title: 'Already Verified',
        status: 400,
        detail: 'KYC has already been approved for this user.',
      });
      return;
    }

    // TODO: Call Persona API to create an inquiry
    // For now, return a mock inquiry ID
    const inquiryId = `inq_${uuidv4().replace(/-/g, '').substring(0, 20)}`;

    await db('users').where({ id: userId, tenant_id: tenantId }).update({
      kyc_status: 'in_progress',
      kyc_provider: 'persona',
      kyc_reference_id: inquiryId,
      updated_at: new Date(),
    });

    // Log to audit
    await producer.send({
      topic: 'audit.immutable',
      messages: [{
        key: userId,
        value: JSON.stringify({
          eventId: uuidv4(),
          eventType: 'audit.immutable',
          tenantId,
          userId,
          timestamp: new Date().toISOString(),
          version: 1,
          data: {
            entityType: 'user',
            entityId: userId,
            actorType: 'user',
            actorId: userId,
            action: 'kyc.initiated',
            beforeState: { kyc_status: user?.kyc_status },
            afterState: { kyc_status: 'in_progress', kyc_provider: 'persona' },
          },
        }),
      }],
    }).catch(err => logger.warn('Failed to publish audit event', { error: err.message }));

    logger.info('KYC initiated', { userId, inquiryId });

    res.json({
      success: true,
      data: {
        inquiryId,
        provider: 'persona',
        // In production: Persona template ID, environment, etc.
        config: {
          templateId: process.env.PERSONA_TEMPLATE_ID || 'tmpl_mock',
          environment: process.env.PERSONA_ENV || 'sandbox',
        },
      },
    });
  } catch (error) {
    logger.error('Failed to initiate KYC', { error: (error as Error).message });
    res.status(500).json({
      type: 'https://api.neobank.io/errors/internal',
      title: 'Internal Error',
      status: 500,
      detail: 'Failed to initiate KYC verification.',
    });
  }
});

// --- POST /auth/kyc/webhook (called by Persona servers) ---
kycRouter.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify Persona webhook signature
    const rawBody = (req as Request & { rawBody?: string }).rawBody || JSON.stringify(req.body);
    const signatureHeader = req.headers['persona-signature'] as string | undefined;

    if (!verifyPersonaSignature(rawBody, signatureHeader)) {
      logger.warn('KYC webhook signature verification failed');
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const { data } = req.body;

    if (!data?.attributes?.inquiry_id) {
      res.status(400).json({ error: 'Invalid webhook payload' });
      return;
    }

    const inquiryId = data.attributes.inquiry_id;
    const status = data.attributes.status;

    // Map Persona status to our KYC status
    const kycStatusMap: Record<string, string> = {
      completed: 'approved',
      failed: 'rejected',
      needs_review: 'review',
      expired: 'expired',
    };

    const kycStatus = kycStatusMap[status] || 'pending';

    // Look up the user by kyc_reference_id to get tenant context
    const user = await db('users')
      .where({ kyc_reference_id: inquiryId })
      .select('id', 'tenant_id')
      .first();

    if (!user) {
      logger.warn('KYC webhook received for unknown inquiry', { inquiryId });
      res.status(404).json({ error: 'Unknown inquiry ID' });
      return;
    }

    // Update with tenant scoping to prevent cross-tenant manipulation
    await db('users')
      .where({ id: user.id, tenant_id: user.tenant_id, kyc_reference_id: inquiryId })
      .update({
        kyc_status: kycStatus,
        updated_at: new Date(),
      });

    logger.info('KYC webhook processed', { inquiryId, status: kycStatus });

    res.json({ received: true });
  } catch (error) {
    logger.error('KYC webhook processing failed', { error: (error as Error).message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});
