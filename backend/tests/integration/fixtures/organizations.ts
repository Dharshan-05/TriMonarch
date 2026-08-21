import { orgAId, orgBId } from './database';

export const createTestOrgAData = () => ({
  id: orgAId,
  name: 'Acme Org A',
  code: 'ORG-A',
  status: 'active',
});

export const createTestOrgBData = () => ({
  id: orgBId,
  name: 'Beta Org B',
  code: 'ORG-B',
  status: 'active',
});
