import { describe, it, expect } from 'vitest';
import { handleDatabaseError, DatabaseError } from '../../../src/db/errors';

describe('Phase 065 — Lock Timeout Handling Tests', () => {
  it('maps PostgreSQL 55P03 lock_not_available code to DatabaseError', () => {
    expect(() => {
      handleDatabaseError({ code: '55P03', message: 'canceling statement due to lock timeout' });
    }).toThrow(DatabaseError);
  });
});
