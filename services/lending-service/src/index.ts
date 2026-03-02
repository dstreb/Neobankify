import express from 'express';
import { loansRouter } from './routes/loans';
import { underwritingRouter } from './routes/underwriting';
import { paymentsRouter } from './routes/payments';
import { complianceRouter } from './routes/compliance';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3013;

app.use(express.json());

app.use('/loans', loansRouter);
app.use('/underwriting', underwritingRouter);
app.use('/payments', paymentsRouter);
app.use('/compliance', complianceRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'lending-service' });
});

app.listen(PORT, () => {
  logger.info(`Lending Service running on port ${PORT}`);
});

export default app;
