import Redis from 'ioredis';
import { logger } from './logger';

// Gateway Redis client — no keyPrefix so that tenant-resolver cache keys
// are raw tenant UUIDs (independent of the tenant-service Redis namespace).
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: 1,
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.warn('Gateway Redis connection error (non-fatal)', { error: err.message });
});

// Attempt to connect but don't block startup — tenant-resolver
// falls through to DB if Redis is unavailable.
redis.connect().catch(() => {
  logger.warn('Gateway Redis unavailable at startup — tenant validation will use DB only');
});

export default redis;
