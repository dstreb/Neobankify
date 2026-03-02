import express from 'express';
import { accountsRouter } from './routes/accounts';
import { webhookRouter } from './routes/webhooks';
import { logger } from './config/logger';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json({
  verify: (req: express.Request, _res, buf) => {
    (req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8');
  },
}));

app.use('/accounts', accountsRouter);
app.use('/webhooks', webhookRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'account-aggregation' });
});

app.listen(PORT, () => {
  logger.info(`Account Aggregation Service running on port ${PORT}`);
});

export default app;
