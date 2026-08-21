import { signAccessToken } from '../../../src/utils/jwt';
import { authOrgA, authUserA } from './authFixtures';

export const createValidAuthHeader = (userId = authUserA.id, orgId = authOrgA.id): string => {
  const result = signAccessToken(userId, orgId);
  return `Bearer ${result.accessToken}`;
};
