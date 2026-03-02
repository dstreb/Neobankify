import express from 'express';
import { notificationRouter } from './routes/notifications';
import { NotificationConsumer } from './consumers/notification-consumer';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3010;

app.use(express.json());

app.use('/notifications', notificationRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

// Start Kafka consumer for notification events
const consumer = new NotificationConsumer();
consumer.start().catch(err => {
  logger.error('Failed to start notification consumer', { error: err.message });
});

app.listen(PORT, () => {
  logger.info(`Notification Service running on port ${PORT}`);
});

export default app;
