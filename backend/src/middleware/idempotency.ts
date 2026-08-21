import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      idempotencyKey?: string;
    }
  }
}

export const idempotencyHandler = (req: Request, _res: Response, next: NextFunction): void => {
  const rawKey = req.headers['idempotency-key'];
  if (typeof rawKey === 'string' && rawKey.trim().length > 0) {
    const key = rawKey.trim();
    if (key.length < 8 || key.length > 128) {
      return next(new ValidationError('Idempotency-Key must be between 8 and 128 characters long'));
    }
    req.idempotencyKey = key;
  }
  next();
};
