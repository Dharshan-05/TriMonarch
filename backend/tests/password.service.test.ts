import { describe, it, expect } from 'vitest';
import { passwordService } from '../src/services/password.service';
import { ValidationError } from '../src/types';

describe('Password Service Unit Tests (Phase 042)', () => {
  it('should hash password and verify matching password correctly', async () => {
    const raw = 'SecurePassword123!';
    const hash = await passwordService.hashPassword(raw);

    expect(hash).not.toBe(raw);
    expect(await passwordService.verifyPassword(raw, hash)).toBe(true);
    expect(await passwordService.verifyPassword('WrongPassword123!', hash)).toBe(false);
  });

  it('should reject passwords shorter than 12 characters', async () => {
    await expect(passwordService.hashPassword('Short123!')).rejects.toThrow(ValidationError);
  });

  it('should reject empty or whitespace-only passwords', async () => {
    await expect(passwordService.hashPassword('   ')).rejects.toThrow(ValidationError);
  });

  it('should support long passphrases and Unicode passwords', async () => {
    const unicodePass = 'P@sswørð_🔑_Super_Long_Passphrase_12345';
    const hash = await passwordService.hashPassword(unicodePass);
    expect(await passwordService.verifyPassword(unicodePass, hash)).toBe(true);
  });
});
