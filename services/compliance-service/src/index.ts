import express from 'express';
import { complianceRouter } from './routes/compliance';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3009;

app.use(express.json());
app.use('/compliance', complianceRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'compliance-service' });
});

app.listen(PORT, () => {
  logger.info(`Compliance Service running on port ${PORT}`);
});

export default app;
