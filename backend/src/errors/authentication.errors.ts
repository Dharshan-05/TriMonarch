import { AppError } from '../types';

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', code = 'AUTHENTICATION_REQUIRED') {
    super(message, 401, code);
  }
}

export class AuthenticationRequiredError extends AuthenticationError {
  constructor(message = 'Authentication is required to access this resource') {
    super(message, 'AUTHENTICATION_REQUIRED');
  }
}

export class InvalidAuthenticationError extends AuthenticationError {
  constructor(message = 'Invalid authentication identity or credentials') {
    super(message, 'INVALID_AUTHENTICATION');
  }
}

export class UserAuthenticationDisabledError extends AuthenticationError {
  constructor(message = 'User account is disabled or suspended') {
    super(message, 'ACCOUNT_DISABLED');
  }
}

export class AuthenticationContextError extends AuthenticationError {
  constructor(message = 'Failed to establish valid authentication context') {
    super(message, 'AUTHENTICATION_CONTEXT_ERROR');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden: Insufficient permissions', code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

export class InsufficientPermissionsError extends ForbiddenError {
  constructor(message = 'Insufficient permissions to perform this action') {
    super(message, 'INSUFFICIENT_PERMISSIONS');
  }
}

