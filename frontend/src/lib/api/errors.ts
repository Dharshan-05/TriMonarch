export type ApiErrorCategory =
  | 'NETWORK_ERROR'
  | 'TIMEOUT_ERROR'
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SERVER_ERROR'
  | 'UNKNOWN_ERROR';

export class ApiError extends Error {
  public readonly code: string;
  public readonly category: ApiErrorCategory;
  public readonly status: number;
  public readonly details?: unknown;
  public readonly requestId?: string;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    category: ApiErrorCategory = 'UNKNOWN_ERROR',
    status: number = 500,
    details?: unknown,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.category = category;
    this.status = status;
    this.details = details;
    this.requestId = requestId;
  }

  public static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
