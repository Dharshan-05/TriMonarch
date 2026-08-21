import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../../../src/utils/password';

describe('Phase 068 — Password Security Audit', () => {
  it('hashes password securely with salt and verifies correctness', async () => {
    const plain = 'SecureP@ss123!';
    const hash = await hashPassword(plain);

    expect(hash).not.toBe(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword('WrongP@ss', hash)).toBe(false);
  });
});
