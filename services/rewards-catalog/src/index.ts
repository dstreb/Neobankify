import express from 'express';
import { rewardsRouter } from './routes/rewards';
import { recommendationsRouter } from './routes/recommendations';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());

app.use('/rewards', rewardsRouter);
app.use('/recommendations', recommendationsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'rewards-catalog' });
});

app.listen(PORT, () => {
  logger.info(`Rewards Catalog Service running on port ${PORT}`);
});

export default app;
