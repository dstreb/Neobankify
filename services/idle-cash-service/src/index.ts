import express from 'express';
import { idleCashRouter } from './routes/idle-cash';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3007;

app.use(express.json());
app.use('/idle-cash', idleCashRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'idle-cash-service' });
});

app.listen(PORT, () => {
  logger.info(`Idle Cash Service running on port ${PORT}`);
});

export default app;
