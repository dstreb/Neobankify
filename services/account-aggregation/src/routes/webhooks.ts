import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

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
    // TODO: Verify Plaid webhook signature
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
  payload: Record<string, unknown>
): Promise<void> {
  switch (code) {
    case 'INITIAL_UPDATE':
      logger.info('Initial transaction sync complete', { itemId });
      // TODO: Fetch and store initial transactions
      break;
    case 'HISTORICAL_UPDATE':
      logger.info('Historical transaction sync complete', { itemId });
      // TODO: Fetch and store historical transactions
      break;
    case 'DEFAULT_UPDATE':
      logger.info('New transactions available', { itemId });
      // TODO: Fetch new transactions and publish to Kafka
      break;
    case 'TRANSACTIONS_REMOVED':
      logger.info('Transactions removed', { itemId });
      // TODO: Handle removed transactions
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
  switch (code) {
    case 'ERROR':
      logger.warn('Plaid item error', { itemId, error: payload.error });
      // TODO: Update account status, notify user
      break;
    case 'PENDING_EXPIRATION':
      logger.warn('Plaid item pending expiration', { itemId });
      // TODO: Notify user to re-authenticate
      break;
    default:
      logger.info('Unknown item webhook code', { code, itemId });
  }
}
