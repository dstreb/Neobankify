import express from 'express';
import { auditRouter } from './routes/audit';
import { AuditConsumer } from './consumers/audit-consumer';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3008;

app.use(express.json());
app.use('/audit', auditRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'audit-service' });
});

// Start Kafka consumer for immutable audit events
const consumer = new AuditConsumer();
consumer.start().catch(err => {
  logger.error('Failed to start audit consumer', { error: err.message });
});

app.listen(PORT, () => {
  logger.info(`Audit Service running on port ${PORT}`);
});

export default app;
