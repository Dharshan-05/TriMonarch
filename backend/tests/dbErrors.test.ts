import { describe, it, expect } from 'vitest';
import {
  handleDatabaseError,
  DuplicateKeyError,
  ForeignKeyViolationError,
  CheckConstraintViolationError,
  NotNullViolationError,
  DatabaseError,
} from '../src/db/errors';

describe('Database Error Normalization', () => {
  it('should map PG code 23505 to DuplicateKeyError', () => {
    const pgErr = { code: '23505', detail: 'Key (email)=(test@example.com) already exists.' };
    expect(() => handleDatabaseError(pgErr)).toThrow(DuplicateKeyError);
  });

  it('should map PG code 23503 to ForeignKeyViolationError', () => {
    const pgErr = { code: '23503', detail: 'Key (organization_id)=(...) is not present in table organizations.' };
    expect(() => handleDatabaseError(pgErr)).toThrow(ForeignKeyViolationError);
  });

  it('should map PG code 23514 to CheckConstraintViolationError', () => {
    const pgErr = { code: '23514', message: 'new row for relation inventory violates check constraint' };
    expect(() => handleDatabaseError(pgErr)).toThrow(CheckConstraintViolationError);
  });

  it('should map PG code 23502 to NotNullViolationError', () => {
    const pgErr = { code: '23502', column: 'name' };
    expect(() => handleDatabaseError(pgErr)).toThrow(NotNullViolationError);
  });

  it('should fallback to DatabaseError for unhandled errors', () => {
    const genericErr = new Error('Connection timeout');
    expect(() => handleDatabaseError(genericErr)).toThrow(DatabaseError);
  });
});
