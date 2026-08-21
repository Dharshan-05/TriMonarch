import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import { mapErrorToResponse } from '../errors/errorMapper';
import { getOrganizationId } from './organizationContext';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'accesstoken',
  'refreshtoken',
  'token',
  'secret',
  'authorization',
  'jwt',
  'apikey',
  'database_url',
]);

const sanitizeLogObject = (obj: unknown): unknown => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeLogObject);
  }
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const mapped = mapErrorToResponse(err);

  let userId: string | undefined;
  let organizationId: string | undefined;

  try {
    if (req.auth) {
      userId = req.auth.userId;
    }
    organizationId = getOrganizationId(req);
  } catch {
    // Ignore extraction errors if context is not established
  }

  const logPayload = {
    timestamp: new Date().toISOString(),
    requestId: req.id,
    method: req.method,
    path: req.originalUrl || req.path,
    statusCode: mapped.statusCode,
    errorCode: mapped.code,
    userId,
    organizationId,
    errorName: err.name,
    errorMessage: err.message,
    ...(mapped.statusCode === 500 && { stack: err.stack }),
    params: sanitizeLogObject(req.params),
    query: sanitizeLogObject(req.query),
  };

  if (mapped.statusCode >= 500) {
    logger.error(logPayload, 'Unhandled or server error');
  } else {
    logger.warn(logPayload, 'Client or application operational error');
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code: mapped.code,
      message: mapped.message,
      ...(req.id && { requestId: req.id }),
      ...(mapped.details !== undefined && { details: mapped.details }),
      ...(env.NODE_ENV === 'development' && { debug: { type: err.name } }),
    },
  };

  res.status(mapped.statusCode).json(response);
};
