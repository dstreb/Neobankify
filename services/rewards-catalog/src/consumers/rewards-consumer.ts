/**
 * Kafka Consumer for Reward Tracking
 *
 * Listens to the `transactions.enriched` topic and calculates rewards
 * for each enriched transaction.
 *
 * Consumer group: `rewards-pipeline`
 * Input topic: `transactions.enriched`
 */
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { trackTransactionReward } from '../lib/reward-tracker';
import { logger } from '../config/logger';

const kafka = new Kafka({
  clientId: 'rewards-consumer',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

let consumer: Consumer | null = null;

/**
 * Start the rewards consumer.
 */
export async function startRewardsConsumer(): Promise<void> {
  consumer = kafka.consumer({ groupId: 'rewards-pipeline' });

  await consumer.connect();
  await consumer.subscribe({ topic: 'transactions.enriched', fromBeginning: false });

  logger.info('Rewards consumer started, listening on transactions.enriched');

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

        if (!data?.transactionId || !data?.rewardEligible) {
          logger.debug('Skipping non-reward-eligible transaction', {
            transactionId: data?.transactionId,
            rewardEligible: data?.rewardEligible,
          });
          return;
        }

        // Skip negative amounts (refunds/credits from Plaid) — rewards only apply to spending
        if (data.amount <= 0) {
          logger.debug('Skipping non-positive amount transaction for rewards', {
            transactionId: data.transactionId,
            amount: data.amount,
          });
          return;
        }

        await trackTransactionReward({
          transactionId: data.transactionId,
          userId: event.userId,
          tenantId: event.tenantId,
          amount: data.amount,
          category: data.category,
          subcategory: data.subcategory || 'general',
          merchantNormalized: data.merchantNormalized,
          merchantCanonical: data.merchantCanonical || null,
          cardUsed: null, // Not available from enrichment event
        });

        logger.debug('Reward tracked via consumer', {
          transactionId: data.transactionId,
          partition,
        });
      } catch (error) {
        logger.error('Rewards consumer error', {
          error: (error as Error).message,
          topic,
          partition,
          offset: message.offset,
        });
      }
    },
  });
}

/**
 * Stop the rewards consumer gracefully.
 */
export async function stopRewardsConsumer(): Promise<void> {
  if (consumer) {
    await consumer.disconnect();
    consumer = null;
    logger.info('Rewards consumer stopped');
  }
}
