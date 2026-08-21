import { describe, it, expect } from 'vitest';
import { handleDatabaseError } from '../../../src/db/errors';
import { DuplicateKeyError, ForeignKeyViolationError } from '../../../src/db/errors';

describe('Phase 064 — PostgreSQL Constraint Failure Rollback Tests', () => {
  it('should map 23505 unique violation to DuplicateKeyError', () => {
    expect(() => {
      handleDatabaseError({ code: '23505', detail: 'Key (email)=(test@example.com) already exists.' });
    }).toThrow(DuplicateKeyError);
  });

  it('should map 23503 foreign key violation to ForeignKeyViolationError', () => {
    expect(() => {
      handleDatabaseError({ code: '23503', detail: 'Key (product_id)=(p-99) is not present in table "products".' });
    }).toThrow(ForeignKeyViolationError);
  });
});
