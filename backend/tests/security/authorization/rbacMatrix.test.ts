import { describe, it, expect } from 'vitest';
import { authorizationService } from '../../../src/services/authorization.service';

describe('Phase 069 — RBAC Permission Matrix Audit', () => {
  it('grants permission checks correctly for ADMIN and denies for unassigned roles', () => {
    const adminHasProductWrite = authorizationService.hasPermission(['ADMIN'], 'product:write' as never);
    expect(adminHasProductWrite).toBe(true);

    const employeeHasAuditManage = authorizationService.hasPermission(['EMPLOYEE'], 'audit:manage' as never);
    expect(employeeHasAuditManage).toBe(false);
  });
});
