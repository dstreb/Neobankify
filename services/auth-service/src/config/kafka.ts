import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'auth-service',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  logLevel: logLevel.WARN,
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'auth-service-group' });

export async function connectKafka(): Promise<void> {
  await producer.connect();
}

export async function disconnectKafka(): Promise<void> {
  await producer.disconnect();
}

export default kafka;
