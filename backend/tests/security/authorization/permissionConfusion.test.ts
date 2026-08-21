import { describe, it, expect } from 'vitest';
import { WILDCARD_PERMISSION_PAYLOADS } from './authzSecurityPayloads';
import { authorizationService } from '../../../src/services/authorization.service';

describe('Phase 069 — Permission Confusion / Wildcard Audit', () => {
  it('does not grant unexpected authorization for malformed or wildcard permission values', () => {
    for (const payload of WILDCARD_PERMISSION_PAYLOADS) {
      const granted = authorizationService.hasPermission(['EMPLOYEE'], payload as never);
      expect(granted).toBe(false);
    }
  });
});
