export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message = 'Validation failed', details: unknown = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export interface HealthCheckResponse {
  success: boolean;
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    latencyMs?: number;
    error?: string;
  };
}
