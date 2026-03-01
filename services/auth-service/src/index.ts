import express from 'express';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/users';
import { kycRouter } from './routes/kyc';
import { logger } from './config/logger';
import { connectKafka } from './config/kafka';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/auth/kyc', kycRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'auth-service' });
});

async function start() {
  try {
    await connectKafka();
    logger.info('Kafka producer connected');
  } catch (err) {
    logger.error('Failed to connect Kafka producer — audit events will be degraded', {
      error: (err as Error).message,
    });
  }

  app.listen(PORT, () => {
    logger.info(`Auth Service running on port ${PORT}`);
  });
}

start();

export default app;
