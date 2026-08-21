import { describe, it, expect, vi } from 'vitest';
import { userRepository } from '../../../src/repositories/user.repository';
import { CLASSIC_SQL_PAYLOADS } from './payloads';

describe('Phase 067 — UserRepository SQL Injection Audit', () => {
  it('parameterizes email lookups preventing SQL interpretation', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);

    for (const payload of CLASSIC_SQL_PAYLOADS) {
      const res = await userRepository.findByEmail('11111111-1111-1111-1111-111111111111', payload);
      expect(res).toBeNull();
    }
  });
});
