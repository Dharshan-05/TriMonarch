import { PolicyContext } from '../../../src/types/policy';
import { authzOrgA, authzUserA } from './authzFixtures';

export const createPolicyContext = (
  userId = authzUserA.id,
  orgId = authzOrgA.id,
  roles = ['EMPLOYEE'],
): PolicyContext => {
  return {
    userId,
    organizationId: orgId,
    roles,
  };
};
