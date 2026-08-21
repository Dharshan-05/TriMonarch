import { ApiError, ApiErrorCategory } from './errors';

export interface FormattedError {
  title: string;
  message: string;
  category: ApiErrorCategory;
  status: number;
}

export function formatApiError(error: unknown): FormattedError {
  if (ApiError.isApiError(error)) {
    const cleaned = cleanMessage(error.message);
    switch (error.status) {
      case 400:
        return {
          title: 'Invalid Request',
          message: cleaned || 'The submitted request parameters or payload are invalid.',
          category: error.category,
          status: 400,
        };
      case 401:
        return {
          title: 'Authentication Required',
          message: 'Your session has expired or is invalid. Please sign in again.',
          category: error.category,
          status: 401,
        };
      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
          category: error.category,
          status: 403,
        };
      case 404:
        return {
          title: 'Resource Not Found',
          message: cleaned || 'The requested resource could not be found.',
          category: error.category,
          status: 404,
        };
      case 409:
        return {
          title: 'Conflict Detected',
          message: cleaned || 'A resource with duplicate unique identifiers already exists.',
          category: error.category,
          status: 409,
        };
      case 422:
        return {
          title: 'Validation Error',
          message: cleaned || 'One or more submitted fields failed validation.',
          category: error.category,
          status: 422,
        };
      case 429:
        return {
          title: 'Rate Limit Exceeded',
          message: 'Too many requests sent. Please wait a moment before trying again.',
          category: error.category,
          status: 429,
        };
      case 500:
      default:
        if (error.category === 'NETWORK_ERROR' || error.status === 0) {
          return {
            title: 'Connection Unreachable',
            message: 'Unable to communicate with the server. Please verify your network connection.',
            category: 'NETWORK_ERROR',
            status: 0,
          };
        }
        if (error.category === 'TIMEOUT_ERROR') {
          return {
            title: 'Request Timed Out',
            message: 'The server took too long to respond. Please try again.',
            category: 'TIMEOUT_ERROR',
            status: 408,
          };
        }
        return {
          title: 'Server Error',
          message: cleaned || 'An unexpected server error occurred. Please try again later.',
          category: 'SERVER_ERROR',
          status: error.status || 500,
        };
    }
  }

  if (error instanceof Error) {
    return {
      title: 'Application Error',
      message: cleanMessage(error.message) || 'An unexpected client error occurred.',
      category: 'UNKNOWN_ERROR',
      status: 500,
    };
  }

  return {
    title: 'Unexpected Error',
    message: 'An unknown error occurred. Please try again.',
    category: 'UNKNOWN_ERROR',
    status: 500,
  };
}

function cleanMessage(raw: string): string {
  if (!raw) return '';
  // Redact raw SQL or database error patterns if present
  if (raw.toLowerCase().includes('postgresql') || raw.toLowerCase().includes('violates unique constraint') || raw.toLowerCase().includes('syntax error at or near')) {
    if (raw.toLowerCase().includes('unique constraint') || raw.toLowerCase().includes('duplicate key')) {
      return 'A record with duplicate information already exists.';
    }
    return 'A database operational error occurred.';
  }
  return raw;
}
