import rateLimit from 'express-rate-limit';
import type { Request } from 'express';

// Extract tenant and user identifiers for rate limiting
const keyGenerator = (req: Request): string => {
  const tenantId = req.headers['x-tenant-id'] as string || 'unknown';
  const userId = (req as unknown as Record<string, unknown>).userId as string || req.ip || 'anonymous';
  return `${tenantId}:${userId}`;
};

export const rateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  message: {
    type: 'https://api.neobank.io/errors/rate-limit',
    title: 'Rate Limit Exceeded',
    status: 429,
    detail: 'Too many requests. Please retry after the window resets.',
  },
});
