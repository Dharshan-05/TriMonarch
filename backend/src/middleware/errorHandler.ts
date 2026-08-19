import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, ErrorResponse } from '../types';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    if ('details' in err) {
      details = (err as { details?: unknown }).details;
    }
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed';
    details = err.flatten().fieldErrors;
  } else if (err.name === 'SyntaxError' && 'status' in err) {
    statusCode = 400;
    code = 'BAD_REQUEST';
    message = 'Invalid JSON syntax';
  } else {
    logger.error({ err }, 'Unhandled application error');
  }

  const response: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(response);
};
