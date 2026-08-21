import { describe, it, expect } from 'vitest';
import { handleDatabaseError } from '../../../src/db/errors';

describe('Phase 070 — Database Constraint Integrity Audit', () => {
  it('maps PostgreSQL unique constraint error 23505 safely', () => {
    const pgErr = { code: '23505', detail: 'Key (sku)=(SKU-1) already exists.' };
    expect(() => handleDatabaseError(pgErr)).toThrow();
  });
});
