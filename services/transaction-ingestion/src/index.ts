import express from 'express';
import { transactionRouter } from './routes/transactions';
import { enrichmentRouter } from './routes/enrichment';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

app.use('/transactions', transactionRouter);
app.use('/enrichment', enrichmentRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'transaction-ingestion' });
});

app.listen(PORT, () => {
  logger.info(`Transaction Ingestion Service running on port ${PORT}`);
});

export default app;
