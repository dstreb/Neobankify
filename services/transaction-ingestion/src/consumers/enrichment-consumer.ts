/**
 * Kafka Consumer for Real-Time Transaction Enrichment
 *
 * Listens to the `transactions.raw` topic and enriches each transaction
 * in real-time through the enrichment pipeline.
 *
 * Consumer group: `enrichment-pipeline`
 * Input topic: `transactions.raw`
 * Output topic: `transactions.enriched` (published by enrichment pipeline)
 */
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { enrichAndPersist, RawTransaction } from '../lib/enrichment-pipeline';
import { logger } from '../config/logger';
import db from '../config/database';

const kafka = new Kafka({
  clientId: 'enrichment-consumer',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

let consumer: Consumer | null = null;

/**
 * Start the enrichment consumer.
 */
export async function startEnrichmentConsumer(): Promise<void> {
  consumer = kafka.consumer({ groupId: 'enrichment-pipeline' });

  await consumer.connect();
  await consumer.subscribe({ topic: 'transactions.raw', fromBeginning: false });

  logger.info('Enrichment consumer started, listening on transactions.raw');

  await consumer.run({
    eachMessage: async (payload: EachMessagePayload) => {
      const { topic, partition, message } = payload;

      try {
        if (!message.value) {
          logger.warn('Received empty message', { topic, partition });
          return;
        }

        const event = JSON.parse(message.value.toString());
        const data = event.data;

        if (!data?.transactionId) {
          logger.warn('Missing transactionId in event', { eventType: event.eventType });
          return;
        }

        // Fetch the full transaction from DB
        const row = await db('transactions')
          .where({ id: data.transactionId })
          .first();

        if (!row) {
          logger.warn('Transaction not found for enrichment', {
            transactionId: data.transactionId,
          });
          return;
        }

        // Extract Plaid categories from enrichment_data if stored during Plaid sync,
        // so the enrichment pipeline can use them as a fallback instead of defaulting to 'other'.
        const existingEnrichment = row.enrichment_data
          ? (typeof row.enrichment_data === 'string' ? JSON.parse(row.enrichment_data) : row.enrichment_data)
          : {};

        const txn: RawTransaction = {
          id: row.id,
          userId: row.user_id,
          tenantId: row.tenant_id,
          accountId: row.account_id,
          amount: row.amount,
          merchantName: row.merchant_name,
          mccCode: row.mcc_code || data.mccCode || null,
          transactionDate: row.transaction_date,
          status: row.status,
          plaidCategory: existingEnrichment.plaidCategory || row.category || null,
          plaidDetailedCategory: existingEnrichment.plaidDetailedCategory || row.subcategory || null,
        };

        await enrichAndPersist(txn);

        logger.debug('Transaction enriched via consumer', {
          transactionId: data.transactionId,
          partition,
        });
      } catch (error) {
        logger.error('Enrichment consumer error', {
          error: (error as Error).message,
          topic,
          partition,
          offset: message.offset,
        });
        // Don't rethrow — we don't want to crash the consumer for a single bad message
      }
    },
  });
}

/**
 * Stop the enrichment consumer gracefully.
 */
export async function stopEnrichmentConsumer(): Promise<void> {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    logger.info('Enrichment consumer stopped');
  }
}
