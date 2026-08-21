import { describe, it, expect } from 'vitest';
import { employeePolicy } from '../src/policies/employee.policy';
import { PolicyContext } from '../src/types/policy';

describe('Employee Policy Unit Tests (Phase 045)', () => {
  const orgA = '11111111-1111-1111-1111-111111111111';

  it('should allow employee to read own record', () => {
    const context: PolicyContext = { userId: 'u-1', organizationId: orgA, roles: ['EMPLOYEE'] };
    const resource = { id: 'emp-1', organization_id: orgA, user_id: 'u-1' };

    const decision = employeePolicy.evaluate(context, 'READ', resource);
    expect(decision.allowed).toBe(true);
  });

  it('should deny employee updating sensitive fields like salary', () => {
    const context: PolicyContext = {
      userId: 'u-1',
      organizationId: orgA,
      roles: ['EMPLOYEE'],
      requestedFields: ['salary'],
    };
    const resource = { id: 'emp-1', organization_id: orgA, user_id: 'u-1' };

    const decision = employeePolicy.evaluate(context, 'UPDATE', resource);
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toContain('sensitive employment fields');
  });

  it('should allow manager to update employee fields', () => {
    const context: PolicyContext = {
      userId: 'mgr-1',
      organizationId: orgA,
      roles: ['MANAGER'],
      requestedFields: ['salary', 'job_title'],
    };
    const resource = { id: 'emp-1', organization_id: orgA, user_id: 'u-1' };

    const decision = employeePolicy.evaluate(context, 'UPDATE', resource);
    expect(decision.allowed).toBe(true);
  });
});
