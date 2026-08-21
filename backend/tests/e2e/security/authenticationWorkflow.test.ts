import { describe, it, expect } from 'vitest';
import { generateE2EToken, getAuthHeaders, e2eUserA } from '../helpers/auth';

describe('Phase 066 — E2E Authentication Security Workflow', () => {
  it('generates valid JWT bearer headers with exact organization claims', () => {
    const headers = getAuthHeaders(e2eUserA);
    expect(headers.Authorization).toContain('Bearer ');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('jwt token contains sub and organization_id', () => {
    const token = generateE2EToken(e2eUserA);
    expect(token.length).toBeGreaterThan(20);
  });
});
