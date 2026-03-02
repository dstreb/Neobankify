import { Router, Request, Response } from 'express';
import { logger } from '../config/logger';
import db from '../config/database';
import { verifyWebhookSignature } from '../lib/plaid-client';
import { syncItemTransactions, refreshBalances } from '../lib/plaid-sync';

export const webhookRouter = Router();

/**
 * Plaid Webhook Handler
 * 
 * Receives real-time updates from Plaid:
 * - TRANSACTIONS: New transactions, removed transactions
 * - ITEM: Error, pending expiration
 * - AUTH: Automatically verified
 */
webhookRouter.post('/plaid', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verify webhook signature
    const isValid = await verifyWebhookSignature(
      JSON.stringify(req.body),
      req.headers as Record<string, string>,
    );
    if (!isValid) {
      logger.warn('Invalid Plaid webhook signature');
      res.status(401).json({ error: 'Invalid webhook signature' });
      return;
    }

    const { webhook_type, webhook_code, item_id } = req.body;

    logger.info('Plaid webhook received', { webhook_type, webhook_code, item_id });

    switch (webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionWebhook(webhook_code, item_id, req.body);
        break;
      case 'ITEM':
        await handleItemWebhook(webhook_code, item_id, req.body);
        break;
      default:
        logger.info('Unhandled webhook type', { webhook_type });
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', { error: (error as Error).message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleTransactionWebhook(
  code: string,
  itemId: string,
  _payload: Record<string, unknown>
): Promise<void> {
  // Find the plaid item in our DB
  const plaidItem = await db('plaid_items')
    .where({ plaid_item_id: itemId, status: 'active' })
    .first();

  if (!plaidItem) {
    logger.warn('Plaid item not found for webhook', { itemId });
    return;
  }

  switch (code) {
    case 'SYNC_UPDATES_AVAILABLE':
    case 'INITIAL_UPDATE':
    case 'HISTORICAL_UPDATE':
    case 'DEFAULT_UPDATE': {
      logger.info('Transaction sync triggered by webhook', { itemId, code });
      try {
        const result = await syncItemTransactions({
          plaidItemDbId: plaidItem.id,
          tenantId: plaidItem.tenant_id,
        });
        logger.info('Webhook-triggered sync complete', {
          itemId,
          added: result.added,
          modified: result.modified,
          removed: result.removed,
        });
      } catch (error) {
        logger.error('Webhook-triggered sync failed', {
          itemId,
          error: (error as Error).message,
        });
        // Update item status to error
        await db('plaid_items')
          .where({ id: plaidItem.id })
          .update({
            error_code: 'SYNC_FAILED',
            error_message: (error as Error).message,
            updated_at: new Date(),
          });
      }
      break;
    }
    case 'TRANSACTIONS_REMOVED':
      logger.info('Transactions removed', { itemId });
      // Handled by syncItemTransactions (removed array)
      try {
        await syncItemTransactions({
          plaidItemDbId: plaidItem.id,
          tenantId: plaidItem.tenant_id,
        });
      } catch (error) {
        logger.error('Failed to handle removed transactions', {
          itemId,
          error: (error as Error).message,
        });
      }
      break;
    default:
      logger.info('Unknown transaction webhook code', { code, itemId });
  }
}

async function handleItemWebhook(
  code: string,
  itemId: string,
  payload: Record<string, unknown>
): Promise<void> {
  const plaidItem = await db('plaid_items')
    .where({ plaid_item_id: itemId })
    .first();

  if (!plaidItem) {
    logger.warn('Plaid item not found for item webhook', { itemId });
    return;
  }

  switch (code) {
    case 'ERROR': {
      const error = payload.error as Record<string, unknown> | undefined;
      logger.warn('Plaid item error', { itemId, error });
      await db('plaid_items')
        .where({ id: plaidItem.id })
        .update({
          status: 'error',
          error_code: (error?.error_code as string) || 'UNKNOWN',
          error_message: (error?.error_message as string) || 'Unknown error',
          updated_at: new Date(),
        });
      // Mark only this item's linked accounts as error state
      await db('linked_accounts')
        .where({ plaid_item_id: plaidItem.id, user_id: plaidItem.user_id, status: 'active' })
        .update({ status: 'error', error_code: 'PLAID_ITEM_ERROR', updated_at: new Date() });
      break;
    }
    case 'PENDING_EXPIRATION': {
      logger.warn('Plaid item pending expiration', { itemId });
      await db('plaid_items')
        .where({ id: plaidItem.id })
        .update({
          status: 'login_required',
          error_code: 'PENDING_EXPIRATION',
          error_message: 'User needs to re-authenticate with their bank',
          updated_at: new Date(),
        });
      break;
    }
    default:
      logger.info('Unknown item webhook code', { code, itemId });
  }
}
