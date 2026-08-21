import { describe, it, expect } from 'vitest';
import { authorizationService } from '../../../src/services/authorization.service';

describe('Phase 063 — AuthorizationService Integration Tests', () => {
  it('hasPermission should grant permission for matching role and permission', () => {
    const hasPerm = authorizationService.hasPermission(['admin'], 'product:read');
    expect(hasPerm).toBe(true);
  });

  it('hasPermission should deny permission when role lacks required permission', () => {
    const hasPerm = authorizationService.hasPermission(['viewer'], 'product:delete');
    expect(hasPerm).toBe(false);
  });
});
