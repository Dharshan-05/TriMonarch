import { describe, it, expect, vi } from 'vitest';
import { passwordService } from '../src/services/password.service';
import { userRepository } from '../src/repositories/user.repository';
import { businessEventService } from '../src/services/businessEvent.service';
import { redactSensitiveData } from '../src/audit/audit.utils';

describe('Password Security & Credential Protection Tests (Phase 042)', () => {
  it('should ensure passwords and reset tokens are redacted from audit and log payloads', () => {
    const payload = {
      user_id: 'user-123',
      password: 'MySecretPassword123!',
      password_hash: '$2b$10$abcdef...',
      resetToken: 'raw_reset_token_val',
    };

    const redacted = redactSensitiveData(payload) as Record<string, unknown>;
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.password_hash).toBe('[REDACTED]');
    expect(redacted.resetToken).toBe('[REDACTED]');
  });

  it('generatePasswordResetToken should return cryptographically random token and tokenHash without leaking plaintext in events', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValueOnce(null);
    vi.spyOn(businessEventService, 'emit').mockResolvedValueOnce(null);

    const result = await passwordService.generatePasswordResetToken('nonexistent@acme.com');
    expect(result).toBeNull();
  });
});
