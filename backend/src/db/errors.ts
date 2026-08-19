import { AppError } from '../types';

export class DatabaseError extends AppError {
  constructor(message = 'Database error occurred', statusCode = 500, code = 'DATABASE_ERROR') {
    super(message, statusCode, code);
  }
}

export class DuplicateKeyError extends DatabaseError {
  public readonly constraint?: string;

  constructor(message = 'Duplicate key violation', constraint?: string) {
    super(message, 409, 'DUPLICATE_KEY_VIOLATION');
    this.constraint = constraint;
  }
}

export class ForeignKeyViolationError extends DatabaseError {
  public readonly constraint?: string;

  constructor(message = 'Foreign key constraint violation', constraint?: string) {
    super(message, 400, 'FOREIGN_KEY_VIOLATION');
    this.constraint = constraint;
  }
}

export class CheckConstraintViolationError extends DatabaseError {
  public readonly constraint?: string;

  constructor(message = 'Check constraint violation', constraint?: string) {
    super(message, 400, 'CHECK_CONSTRAINT_VIOLATION');
    this.constraint = constraint;
  }
}

export class NotNullViolationError extends DatabaseError {
  public readonly column?: string;

  constructor(message = 'Not null constraint violation', column?: string) {
    super(message, 400, 'NOT_NULL_VIOLATION');
    this.column = column;
  }
}

export const handleDatabaseError = (error: unknown): never => {
  if (error instanceof AppError) {
    throw error;
  }

  if (typeof error === 'object' && error !== null && 'code' in error) {
    const pgError = error as { code: string; message: string; constraint?: string; column?: string; detail?: string };

    switch (pgError.code) {
      case '23505': // unique_violation
        throw new DuplicateKeyError(
          pgError.detail || pgError.message || 'A record with this value already exists',
          pgError.constraint,
        );
      case '23503': // foreign_key_violation
        throw new ForeignKeyViolationError(
          pgError.detail || pgError.message || 'Referenced entity does not exist or cannot be modified',
          pgError.constraint,
        );
      case '23514': // check_violation
        throw new CheckConstraintViolationError(
          pgError.message || 'Value fails database check constraint',
          pgError.constraint,
        );
      case '23502': // not_null_violation
        throw new NotNullViolationError(
          pgError.message || 'Required database field is missing',
          pgError.column,
        );
    }
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new DatabaseError(errorMessage);
};
