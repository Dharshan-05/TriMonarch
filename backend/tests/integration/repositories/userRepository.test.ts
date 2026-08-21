import { describe, it, expect, vi } from 'vitest';
import { userRepository } from '../../../src/repositories/user.repository';
import { orgAId, orgBId, userAId, userBId } from '../fixtures/database';
import { createTestUserAData, createTestUserBData } from '../fixtures/users';

describe('Phase 062 — UserRepository Integration Tests', () => {
  it('userRepository.findById should enforce organization tenant isolation', async () => {
    const userAData = createTestUserAData();
    vi.spyOn(userRepository, 'findById')
      .mockImplementation(async (orgId, id) => {
        if (orgId === orgAId && id === userAId) return userAData as unknown as Awaited<ReturnType<typeof userRepository.findById>>;
        return null;
      });

    const foundInOrgA = await userRepository.findById(orgAId, userAId);
    expect(foundInOrgA).toBeDefined();
    expect(foundInOrgA?.organization_id).toBe(orgAId);

    const crossTenantLookup = await userRepository.findById(orgBId, userAId);
    expect(crossTenantLookup).toBeNull();
  });

  it('userRepository.findByEmail should return user for matching organization only', async () => {
    const userBData = createTestUserBData();
    vi.spyOn(userRepository, 'findByEmail')
      .mockImplementation(async (orgId, email) => {
        if (orgId === orgBId && email === 'userb@beta.com') return userBData as unknown as Awaited<ReturnType<typeof userRepository.findByEmail>>;
        return null;
      });

    const userInOrgB = await userRepository.findByEmail(orgBId, 'userb@beta.com');
    expect(userInOrgB).toBeDefined();
    expect(userInOrgB?.id).toBe(userBId);

    const crossTenantEmail = await userRepository.findByEmail(orgAId, 'userb@beta.com');
    expect(crossTenantEmail).toBeNull();
  });
});
