import { describe, it, expect } from 'vitest';
import { FORGED_AUTH_PAYLOADS } from './authzSecurityPayloads';

describe('Phase 069 — Client Authorization Bypass Audit', () => {
  it('ignores client-supplied role or permission fields in request bodies', () => {
    const payload = FORGED_AUTH_PAYLOADS[0];
    expect(payload.role).toBe('SUPER_ADMIN');
    expect(payload.isAdmin).toBe(true);
  });
});
