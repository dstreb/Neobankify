import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import db from '../config/database';
import { logger } from '../config/logger';

/**
 * Immutable Audit Log Consumer.
 * Persists all audit events to PostgreSQL for regulatory retention (7 years).
 * Events in this table are APPEND-ONLY — no updates or deletes.
 */
export class AuditConsumer {
  private consumer: Consumer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'audit-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });
    this.consumer = kafka.consumer({ groupId: 'audit-service-group' });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'audit.immutable', fromBeginning: true });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const event = JSON.parse(payload.message.value?.toString() || '{}');
          await this.persistAuditEntry(event);
        } catch (error) {
          logger.error('Failed to persist audit entry', {
            error: (error as Error).message,
            offset: payload.message.offset,
          });
        }
      },
    });

    logger.info('Audit consumer started — listening on audit.immutable');
  }

  private async persistAuditEntry(event: Record<string, unknown>): Promise<void> {
    const data = event.data as Record<string, unknown>;

    await db('audit_log').insert({
      id: event.eventId,
      tenant_id: event.tenantId,
      user_id: event.userId,
      event_type: event.eventType,
      entity_type: data?.entityType || null,
      entity_id: data?.entityId || null,
      actor_type: data?.actorType || 'system',
      actor_id: data?.actorId || null,
      action: data?.action || null,
      before_state: data?.beforeState ? JSON.stringify(data.beforeState) : null,
      after_state: data?.afterState ? JSON.stringify(data.afterState) : null,
      correlation_id: event.correlationId || null,
      source: event.source || null,
      created_at: event.timestamp || new Date().toISOString(),
    });

    logger.debug('Audit entry persisted', { eventId: event.eventId });
  }
}
