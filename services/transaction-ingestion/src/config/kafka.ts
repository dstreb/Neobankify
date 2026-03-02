import { Kafka, Producer } from 'kafkajs';
import { logger } from './logger';

const kafka = new Kafka({
  clientId: 'transaction-ingestion',
  brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
});

let producer: Producer;

export async function getKafkaProducer(): Promise<Producer> {
  if (!producer) {
    producer = kafka.producer();
    await producer.connect();
    logger.info('Kafka producer connected');
  }
  return producer;
}

export async function publishEvent(topic: string, key: string, event: Record<string, unknown>): Promise<void> {
  const prod = await getKafkaProducer();
  await prod.send({
    topic,
    messages: [{ key, value: JSON.stringify(event) }],
  });
}
