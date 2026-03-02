import express from 'express';
import { tradingRouter } from './routes/trading';
import { positionsRouter } from './routes/positions';
import { marketDataRouter } from './routes/market-data';
import { riskRouter } from './routes/risk';
import { paperTradingRouter } from './routes/paper-trading';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3012;

app.use(express.json());

app.use('/trading', tradingRouter);
app.use('/positions', positionsRouter);
app.use('/market-data', marketDataRouter);
app.use('/risk', riskRouter);
app.use('/paper-trading', paperTradingRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'trading-service' });
});

app.listen(PORT, () => {
  logger.info(`Trading Service running on port ${PORT}`);
});

export default app;
