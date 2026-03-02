import express from 'express';
import { suitabilityRouter } from './routes/suitability';
import { portfolioRouter } from './routes/portfolios';
import { ordersRouter } from './routes/orders';
import { accountsRouter } from './routes/accounts';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3011;

app.use(express.json());

app.use('/suitability', suitabilityRouter);
app.use('/portfolios', portfolioRouter);
app.use('/orders', ordersRouter);
app.use('/accounts', accountsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'investing-service' });
});

app.listen(PORT, () => {
  logger.info(`Investing Service running on port ${PORT}`);
});

export default app;
