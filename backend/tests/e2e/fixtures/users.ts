import { e2eOrgA, e2eOrgB } from './organizations';

export const e2eUserA = {
  id: '33333333-3333-3333-3333-333333333333',
  organization_id: e2eOrgA.id,
  email: 'usera@acme.com',
  name: 'User A',
  roles: ['admin'],
};

export const e2eUserB = {
  id: '44444444-4444-4444-4444-444444444444',
  organization_id: e2eOrgB.id,
  email: 'userb@globex.com',
  name: 'User B',
  roles: ['admin'],
};
