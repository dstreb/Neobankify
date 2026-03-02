import express from 'express';
import { cardsRouter } from './routes/cards';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());
app.use('/cards', cardsRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'card-management' });
});

app.listen(PORT, () => {
  logger.info(`Card Management Service running on port ${PORT}`);
});

export default app;
