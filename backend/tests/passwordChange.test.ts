import { describe, it, expect, vi } from 'vitest';
import { passwordService } from '../src/services/password.service';
import { userRepository } from '../src/repositories/user.repository';
import { businessEventService } from '../src/services/businessEvent.service';
import { AuthenticationError } from '../src/utils/jwt';
import { ValidationError } from '../src/types';

describe('Password Change Workflow Tests (Phase 042)', () => {
  const userId = '33333333-3333-3333-3333-333333333333';
  const orgId = '11111111-1111-1111-1111-111111111111';
  const currentPassword = 'OldPassword123!';
  const newPassword = 'NewPassword123!';

  it('should throw AuthenticationError when current password does not match', async () => {
    const mockUser = {
      id: userId,
      organization_id: orgId,
      name: 'Test',
      email: 'test@acme.com',
      phone: null,
      status: 'active' as const,
      password_hash: await passwordService.hashPassword('DifferentPassword123!'),
      password_changed_at: new Date(),
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(mockUser);
    vi.spyOn(userRepository, 'findByEmailForAuthentication').mockResolvedValueOnce(mockUser);
    vi.spyOn(businessEventService, 'emit').mockResolvedValue(null);

    await expect(
      passwordService.changePassword(userId, orgId, currentPassword, newPassword),
    ).rejects.toThrow(AuthenticationError);
  });

  it('should throw ValidationError when new password is identical to current password', async () => {
    await expect(
      passwordService.changePassword(userId, orgId, currentPassword, currentPassword),
    ).rejects.toThrow(ValidationError);
  });

  it('should successfully change password when current password is valid and emit PASSWORD_CHANGED', async () => {
    const oldHash = await passwordService.hashPassword(currentPassword);
    const mockUser = {
      id: userId,
      organization_id: orgId,
      name: 'Test',
      email: 'test@acme.com',
      phone: null,
      status: 'active' as const,
      password_hash: oldHash,
      password_changed_at: new Date(),
      last_login_at: new Date(),
      created_at: new Date(),
      updated_at: new Date(),
    };

    vi.spyOn(userRepository, 'findById').mockResolvedValueOnce(mockUser);
    vi.spyOn(userRepository, 'findByEmailForAuthentication').mockResolvedValueOnce(mockUser);
    vi.spyOn(userRepository, 'updatePasswordHash').mockResolvedValueOnce();
    vi.spyOn(businessEventService, 'emit').mockResolvedValueOnce(null);

    await passwordService.changePassword(userId, orgId, currentPassword, newPassword);

    expect(userRepository.updatePasswordHash).toHaveBeenCalledWith(userId, expect.any(String), undefined);
    expect(businessEventService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ eventName: 'PASSWORD_CHANGED', organization_id: orgId, user_id: userId }),
      undefined,
    );
  });
});
