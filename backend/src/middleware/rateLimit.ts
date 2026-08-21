import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const hits = new Map<string, RateLimitRecord>();

export const createRateLimiter = (options?: { windowMs?: number; maxRequests?: number }) => {
  const windowMs = options?.windowMs || env.RATE_LIMIT_WINDOW_MS || 900000;
  const maxRequests = options?.maxRequests || env.RATE_LIMIT_MAX_REQUESTS || 1000;

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    let record = hits.get(key);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      hits.set(key, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, maxRequests - record.count);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000).toString());

    if (record.count > maxRequests) {
      res.setHeader('Retry-After', retryAfter.toString());
      res.status(429).json({
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: 'Too many requests, please try again later',
          requestId: req.id,
        },
      });
      return;
    }

    next();
  };
};

export const globalRateLimiter = createRateLimiter();
