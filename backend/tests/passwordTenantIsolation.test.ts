import { describe, it, expect, vi } from 'vitest';
import { passwordService } from '../src/services/password.service';
import { userRepository } from '../src/repositories/user.repository';
import { businessEventService } from '../src/services/businessEvent.service';
import { NotFoundError } from '../src/types';

describe('Password Tenant Isolation Tests (Phase 042)', () => {
  const userId = '33333333-3333-3333-3333-333333333333';
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';

  it('Tenant A user cannot change Tenant B password if user does not belong to Tenant B', async () => {
    vi.spyOn(userRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === userId) {
        return {
          id: userId,
          organization_id: orgAId,
          name: 'Test',
          email: 'usera@acme.com',
          phone: null,
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
        };
      }
      return null;
    });

    vi.spyOn(businessEventService, 'emit').mockResolvedValue(null);

    await expect(
      passwordService.changePassword(userId, orgBId, 'OldPassword123!', 'NewPassword123!'),
    ).rejects.toThrow(NotFoundError);
  });
});
