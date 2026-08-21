import { orgAId, orgBId, userAId, userBId } from './database';

export const createTestUserAData = () => ({
  id: userAId,
  organization_id: orgAId,
  email: 'usera@acme.com',
  name: 'Alice User A',
  password_hash: '$2b$10$abcdefghijklmnopqrstuu',
  status: 'active',
});

export const createTestUserBData = () => ({
  id: userBId,
  organization_id: orgBId,
  email: 'userb@beta.com',
  name: 'Bob User B',
  password_hash: '$2b$10$abcdefghijklmnopqrstuu',
  status: 'active',
});
