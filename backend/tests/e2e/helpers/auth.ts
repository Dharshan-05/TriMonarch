import { signAccessToken } from '../../../src/utils/jwt';
import { e2eUserA, e2eUserB } from '../fixtures/users';

export const generateE2EToken = (user = e2eUserA): string => {
  const result = signAccessToken(user.id, user.organization_id);
  return result.accessToken;
};

export const getAuthHeaders = (user = e2eUserA) => {
  const token = generateE2EToken(user);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export { e2eUserA, e2eUserB };
