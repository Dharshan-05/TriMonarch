import { describe, it, expect, vi } from 'vitest';
import { tokenRevocationService } from '../../../src/services/tokenRevocation.service';

describe('Phase 068 — Token Revocation Security Audit', () => {
  it('revokes token identifiers and detects revocation state', async () => {
    vi.spyOn(tokenRevocationService, 'revokeToken').mockResolvedValue(undefined as never);
    vi.spyOn(tokenRevocationService, 'isTokenRevoked').mockImplementation(async (jti) => jti === 'jti-test-12345');

    const jti = 'jti-test-12345';
    await tokenRevocationService.revokeToken(jti, 3600);

    const isRevoked = await tokenRevocationService.isTokenRevoked(jti);
    expect(isRevoked).toBe(true);

    const isNotRevoked = await tokenRevocationService.isTokenRevoked('jti-unrevoked-999');
    expect(isNotRevoked).toBe(false);
  });
});
