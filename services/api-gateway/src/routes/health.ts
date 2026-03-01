import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '0.1.0',
  });
});

healthRouter.get('/ready', (_req, res) => {
  // TODO: Check downstream service health
  res.json({
    status: 'ready',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
  });
});
