import { describe, it, expect } from 'vitest';
import { policyEngine } from '../../../src/services/policyEngine.service';

describe('Phase 069 — Policy Engine Security Audit', () => {
  it('denies requests for invalid or unmapped resource types', () => {
    const ctx = { userId: 'u-1', organizationId: 'org-1', roles: ['ADMIN'] };
    const decision = policyEngine.evaluate(ctx, 'READ', 'unregistered_resource');
    expect(decision.allowed).toBe(false);
  });
});
