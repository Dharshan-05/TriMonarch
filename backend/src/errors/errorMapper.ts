import { ZodError } from 'zod';
import { AppError } from '../types';
import { ErrorCodes } from './errorCodes';

export interface MappedErrorResult {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export const mapErrorToResponse = (err: unknown): MappedErrorResult => {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      code: err.code,
      message: err.message,
      details: 'details' in err ? (err as { details?: unknown }).details : undefined,
    };
  }

  if (err instanceof ZodError) {
    const formattedDetails = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return {
      statusCode: 400,
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Request validation failed',
      details: formattedDetails,
    };
  }

  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;

    // Express Body Parser Errors
    if (e.type === 'entity.too.large' || e.status === 413) {
      return {
        statusCode: 413,
        code: ErrorCodes.PAYLOAD_TOO_LARGE,
        message: 'Request payload size exceeds configured limit',
      };
    }
    if (e.name === 'SyntaxError' && (e.status === 400 || e.statusCode === 400)) {
      return {
        statusCode: 400,
        code: ErrorCodes.INVALID_JSON,
        message: 'Invalid JSON request body',
      };
    }

    // JWT Errors
    if (e.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        code: ErrorCodes.TOKEN_EXPIRED,
        message: 'Authentication token has expired',
      };
    }
    if (e.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        code: ErrorCodes.INVALID_TOKEN,
        message: 'Invalid authentication token',
      };
    }

    // PostgreSQL Errors (node-postgres / pg error codes)
    const pgCode = typeof e.code === 'string' ? e.code : undefined;
    if (pgCode) {
      switch (pgCode) {
        case '23505':
          return {
            statusCode: 409,
            code: ErrorCodes.DUPLICATE_RESOURCE,
            message: 'A resource with these details already exists',
          };
        case '23503':
          return {
            statusCode: 409,
            code: ErrorCodes.CONFLICT,
            message: 'Referenced entity not found or constraint violated',
          };
        case '23502':
          return {
            statusCode: 400,
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Required database field missing',
          };
        case '23514':
          return {
            statusCode: 400,
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Database check constraint violated',
          };
        case '22P02':
          return {
            statusCode: 400,
            code: ErrorCodes.VALIDATION_ERROR,
            message: 'Invalid input syntax format',
          };
        case '40001':
          return {
            statusCode: 409,
            code: ErrorCodes.CONFLICT,
            message: 'Transaction serialization failure, please retry',
          };
        case '40P01':
          return {
            statusCode: 409,
            code: ErrorCodes.CONFLICT,
            message: 'Deadlock detected, please retry',
          };
        case '08000':
        case '08003':
        case '08006':
        case '57P01':
          return {
            statusCode: 503,
            code: ErrorCodes.DATABASE_UNAVAILABLE,
            message: 'Database connection unavailable',
          };
      }
    }
  }

  return {
    statusCode: 500,
    code: ErrorCodes.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred',
  };
};
