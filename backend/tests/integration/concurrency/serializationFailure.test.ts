import { describe, it, expect } from 'vitest';
import { handleDatabaseError, DatabaseError } from '../../../src/db/errors';

describe('Phase 065 — Serialization Failure & Retry Testing', () => {
  it('maps PostgreSQL 40001 serialization failure code to DatabaseError', () => {
    expect(() => {
      handleDatabaseError({ code: '40001', message: 'could not serialize access due to concurrent update' });
    }).toThrow(DatabaseError);
  });
});
