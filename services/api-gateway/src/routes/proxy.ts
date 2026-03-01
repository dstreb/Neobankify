import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { logger } from '../config/logger';

export const proxyRouter = Router();

// Service registry - maps URL prefixes to backend services
const SERVICE_ROUTES: Record<string, string> = {
  '/auth': process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  '/users': process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  '/tenants': process.env.TENANT_SERVICE_URL || 'http://localhost:3002',
  '/accounts': process.env.ACCOUNT_SERVICE_URL || 'http://localhost:3003',
  '/transactions': process.env.TRANSACTION_SERVICE_URL || 'http://localhost:3004',
  '/rewards': process.env.REWARDS_SERVICE_URL || 'http://localhost:3005',
  '/cards': process.env.CARD_SERVICE_URL || 'http://localhost:3006',
  '/idle-cash': process.env.IDLE_CASH_SERVICE_URL || 'http://localhost:3007',
  '/recommendations': process.env.REWARDS_SERVICE_URL || 'http://localhost:3005',
  '/admin': process.env.TENANT_SERVICE_URL || 'http://localhost:3002',
  '/audit': process.env.AUDIT_SERVICE_URL || 'http://localhost:3008',
  '/compliance': process.env.COMPLIANCE_SERVICE_URL || 'http://localhost:3009',
  '/notifications': process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3010',
};

// Create proxy for each service route
for (const [path, target] of Object.entries(SERVICE_ROUTES)) {
  proxyRouter.use(
    path,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^/v1${path}`]: path },
      on: {
        proxyReq: (proxyReq, req) => {
          // Forward tenant and user context to backend services
          const expressReq = req as Express.Request;
          if (expressReq.tenant?.tenantId) {
            proxyReq.setHeader('X-Tenant-ID', expressReq.tenant.tenantId);
          }
          if (expressReq.userId) {
            proxyReq.setHeader('X-User-ID', expressReq.userId);
          }
          if (req.headers['x-correlation-id']) {
            proxyReq.setHeader('X-Correlation-ID', req.headers['x-correlation-id'] as string);
          }
        },
        error: (err, _req, _res) => {
          logger.error(`Proxy error for ${path}`, { error: err.message, target });
        },
      },
    })
  );
}
