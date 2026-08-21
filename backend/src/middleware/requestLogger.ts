import { Request, Response, NextFunction } from 'express';
import { structuredLogger } from '../observability/logger';
import { recordHttpMetric } from '../observability/metrics';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const method = req.method;
    const path = req.path;
    const requestId = (req.headers['x-request-id'] as string) || (req as unknown as { id?: string }).id;

    recordHttpMetric(method, statusCode, durationMs);

    structuredLogger.info('HTTP request completed', {
      requestId,
      method,
      path,
      statusCode,
      durationMs,
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};
