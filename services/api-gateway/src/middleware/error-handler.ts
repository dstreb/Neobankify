import type { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

interface AppError extends Error {
  status?: number;
  type?: string;
}

/**
 * Global error handler. Returns RFC 7807 Problem Details format.
 * Never exposes internal details in production.
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const status = err.status || 500;
  const correlationId = req.headers['x-correlation-id'] as string;

  logger.error('Unhandled error', {
    correlationId,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    type: err.type || 'https://api.neobank.io/errors/internal',
    title: status === 500 ? 'Internal Server Error' : err.message,
    status,
    detail: process.env.NODE_ENV === 'development'
      ? err.message
      : 'An unexpected error occurred. Please try again later.',
    instance: req.path,
    correlationId,
  });
};
