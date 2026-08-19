import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

export const requestIdHandler = (req: Request, res: Response, next: NextFunction): void => {
  const existingId = req.headers['x-request-id'];
  const requestId = typeof existingId === 'string' && existingId.trim().length > 0
    ? existingId
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
