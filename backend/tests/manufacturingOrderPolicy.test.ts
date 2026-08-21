import { describe, it, expect } from 'vitest';
import { manufacturingOrderPolicy } from '../src/policies/manufacturingOrder.policy';
import { PolicyContext } from '../src/types/policy';

describe('Manufacturing Order Policy State-Aware Tests (Phase 045)', () => {
  const orgA = '11111111-1111-1111-1111-111111111111';

  it('should deny non-admin modifying completed manufacturing order', () => {
    const context: PolicyContext = { userId: 'mgr-1', organizationId: orgA, roles: ['MANAGER'] };
    const resource = { id: 'mo-1', organization_id: orgA, status: 'completed' as const };

    const decision = manufacturingOrderPolicy.evaluate(context, 'UPDATE', resource);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('Cannot modify manufacturing order in final state: completed');
  });

  it('should allow manager to update draft or released manufacturing order', () => {
    const context: PolicyContext = { userId: 'mgr-1', organizationId: orgA, roles: ['MANAGER'] };
    const resource = { id: 'mo-1', organization_id: orgA, status: 'released' as const };

    const decision = manufacturingOrderPolicy.evaluate(context, 'UPDATE', resource);
    expect(decision.allowed).toBe(true);
  });
});
