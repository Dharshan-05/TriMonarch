import { Request, Response, NextFunction } from 'express';
import { MethodNotAllowedError } from '../types';

const ALLOWED_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']);

export const methodGuard = (req: Request, _res: Response, next: NextFunction): void => {
  const method = req.method.toUpperCase();
  if (!ALLOWED_METHODS.has(method)) {
    next(new MethodNotAllowedError(`HTTP method ${req.method} is not allowed`));
    return;
  }
  next();
};
