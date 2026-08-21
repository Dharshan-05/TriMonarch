import { describe, it, expect } from 'vitest';
import { InsufficientPermissionsError } from '../../../src/errors/authentication.errors';

describe('Phase 069 — Authorization Error Contract Audit', () => {
  it('instantiates InsufficientPermissionsError with correct 403 status code', () => {
    const err = new InsufficientPermissionsError('Access denied');
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('INSUFFICIENT_PERMISSIONS');
  });
});
