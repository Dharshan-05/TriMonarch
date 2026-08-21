import { describe, it, expect } from 'vitest';
import { handleDatabaseError, DatabaseError } from '../../../src/db/errors';

describe('Phase 065 — Deadlock Detection & Handling Tests', () => {
  it('maps PostgreSQL 40P01 deadlock code to DatabaseError', () => {
    expect(() => {
      handleDatabaseError({ code: '40P01', message: 'deadlock detected' });
    }).toThrow(DatabaseError);
  });
});
