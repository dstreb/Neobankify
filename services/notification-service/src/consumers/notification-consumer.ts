import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { logger } from '../config/logger';

/**
 * Consumes notification events from Kafka and dispatches to appropriate channels.
 * Supports: push notifications, email, SMS, in-app notifications.
 */
export class NotificationConsumer {
  private consumer: Consumer;

  constructor() {
    const kafka = new Kafka({
      clientId: 'notification-service',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    });

    this.consumer = kafka.consumer({ groupId: 'notification-service-group' });
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.consumer.subscribe({ topic: 'notifications.send', fromBeginning: false });
    await this.consumer.subscribe({ topic: 'agent.recommendations', fromBeginning: false });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          const { topic, message } = payload;
          const event = JSON.parse(message.value?.toString() || '{}');

          switch (topic) {
            case 'notifications.send':
              await this.handleNotificationEvent(event);
              break;
            case 'agent.recommendations':
              await this.handleRecommendationEvent(event);
              break;
            default:
              logger.info('Unknown topic', { topic });
          }
        } catch (error) {
          logger.error('Failed to process notification message', {
            error: (error as Error).message,
            topic: payload.topic,
          });
        }
      },
    });

    logger.info('Notification consumer started');
  }

  private async handleNotificationEvent(event: Record<string, unknown>): Promise<void> {
    const data = event.data as Record<string, unknown>;
    const channel = data.channel as string;

    logger.info('Processing notification', {
      channel,
      userId: event.userId,
      templateId: data.templateId,
    });

    switch (channel) {
      case 'push':
        await this.sendPushNotification(event);
        break;
      case 'email':
        await this.sendEmail(event);
        break;
      case 'sms':
        await this.sendSms(event);
        break;
      case 'in_app':
        await this.storeInAppNotification(event);
        break;
      default:
        logger.warn('Unknown notification channel', { channel });
    }
  }

  private async handleRecommendationEvent(event: Record<string, unknown>): Promise<void> {
    // Convert recommendation to push notification
    const data = event.data as Record<string, unknown>;

    logger.info('Sending recommendation notification', {
      userId: event.userId,
      type: data.type,
    });

    // TODO: Check user notification preferences before sending
    // TODO: Send via FCM/APNs
    await this.sendPushNotification({
      ...event,
      data: {
        channel: 'push',
        templateId: 'recommendation',
        templateData: {
          title: data.title,
          body: data.summary,
          deepLink: `/recommendations/${data.recommendationId}`,
        },
      },
    });
  }

  private async sendPushNotification(event: Record<string, unknown>): Promise<void> {
    // TODO: Integrate with Firebase Cloud Messaging (FCM) + APNs
    logger.info('Push notification sent (mock)', { userId: event.userId });
  }

  private async sendEmail(event: Record<string, unknown>): Promise<void> {
    // TODO: Integrate with SendGrid
    logger.info('Email sent (mock)', { userId: event.userId });
  }

  private async sendSms(event: Record<string, unknown>): Promise<void> {
    // TODO: Integrate with Twilio
    logger.info('SMS sent (mock)', { userId: event.userId });
  }

  private async storeInAppNotification(event: Record<string, unknown>): Promise<void> {
    // TODO: Store in database for in-app notification center
    logger.info('In-app notification stored (mock)', { userId: event.userId });
  }
}
