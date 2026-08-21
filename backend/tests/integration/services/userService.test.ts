import { describe, it, expect, vi } from 'vitest';
import { userService } from '../../../src/services/user.service';
import { userRepository } from '../../../src/repositories/user.repository';
import { orgAId, orgBId, userAId } from '../fixtures/database';

describe('Phase 063 — UserService Integration Tests', () => {
  it('getUserById should enforce tenant isolation at service layer', async () => {
    const userA = {
      id: userAId,
      organization_id: orgAId,
      email: 'usera@acme.com',
      name: 'User A',
      status: 'active',
    };

    vi.spyOn(userRepository, 'findById').mockImplementation(async (orgId, id) => {
      if (orgId === orgAId && id === userAId) return userA as unknown as Awaited<ReturnType<typeof userRepository.findById>>;
      return null;
    });

    const user = await userService.getUserById(orgAId, userAId);
    expect(user).toBeDefined();
    expect(user?.organization_id).toBe(orgAId);

    await expect(userService.getUserById(orgBId, userAId)).rejects.toThrow();
  });
});
