import { describe, it, expect } from 'vitest';
import { authorizationService } from '../../../src/services/authorization.service';

describe('Phase 066 — E2E Authorization & RBAC Workflow', () => {
  it('evaluates admin role permissions correctly', () => {
    const hasPerm = authorizationService.hasPermission(['admin'], 'sales_order:read');
    expect(hasPerm).toBe(true);
  });

  it('rejects unauthorized permissions for restricted role', () => {
    const hasPerm = authorizationService.hasPermission(['inventory_clerk'], 'sales_order:delete');
    expect(hasPerm).toBe(false);
  });
});
