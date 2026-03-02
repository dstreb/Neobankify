import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { rateLimiter } from './middleware/rate-limiter';
import { tenantResolver } from './middleware/tenant-resolver';
import { authMiddleware } from './middleware/auth';
import { requestLogger } from './middleware/request-logger';
import { errorHandler } from './middleware/error-handler';
import { healthRouter } from './routes/health';
import { proxyRouter } from './routes/proxy';
import { logger } from './config/logger';
import db from './config/database';
import redis from './config/redis';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize app.locals so tenant-resolver can validate tenants
// against the database (with Redis cache) instead of silently accepting any UUID.
app.locals.db = db;
app.locals.redis = redis;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '1mb' }));

// Request logging (sanitized - no PII)
app.use(requestLogger);

// Rate limiting (per tenant + per user)
app.use(rateLimiter);

// Health check (no auth required)
app.use('/health', healthRouter);

// Tenant resolution (extracts tenant from JWT or header)
app.use(tenantResolver);

// Authentication (JWT validation)
app.use(authMiddleware);

// Service proxy routes
app.use('/v1', proxyRouter);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
});

export default app;
