import { orgAId, orgBId } from './database';

export const createTestPartnerOrgAData = () => ({
  id: '77777777-7777-7777-7777-777777777777',
  organization_id: orgAId,
  type: 'customer',
  name: 'Acme Partner A',
  email: 'partnera@acme.com',
  status: 'active',
});

export const createTestPartnerOrgBData = () => ({
  id: '88888888-8888-8888-8888-888888888888',
  organization_id: orgBId,
  type: 'supplier',
  name: 'Beta Partner B',
  email: 'partnerb@beta.com',
  status: 'active',
});
