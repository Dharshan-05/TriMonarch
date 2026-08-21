import { describe, it, expect } from 'vitest';
import { sanitizeResponseData } from '../../../src/utils/response';

describe('Phase 068 — Credential Leakage Audit', () => {
  it('omits sensitive password and token fields from API response serializations', () => {
    const rawData = {
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'secret_hash',
      password_hash: 'secret_hash2',
      accessToken: 'token123',
    };

    const sanitized = sanitizeResponseData(rawData);
    expect((sanitized as Record<string, unknown>).passwordHash).toBeUndefined();
    expect((sanitized as Record<string, unknown>).accessToken).toBeUndefined();
  });
});
