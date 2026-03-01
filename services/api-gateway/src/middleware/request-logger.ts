import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger';

/**
 * Logs all incoming requests with sanitized data (no PII).
 * Assigns a correlation ID for distributed tracing.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
  const startTime = Date.now();

  // Attach correlation ID to request and response
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;

    logger.info('HTTP Request', {
      correlationId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      tenantId: req.headers['x-tenant-id'] || 'unknown',
      userAgent: req.headers['user-agent'],
      // Never log: body, auth headers, cookies, IP addresses in detail
    });
  });

  next();
};
