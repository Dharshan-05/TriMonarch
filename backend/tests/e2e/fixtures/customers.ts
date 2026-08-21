import { e2eOrgA, e2eOrgB } from './organizations';

export const e2eCustomerA = {
  id: '55555555-5555-5555-5555-555555555555',
  organization_id: e2eOrgA.id,
  name: 'E2E Customer A',
  code: 'CUST-A',
  email: 'custA@example.com',
};

export const e2eCustomerB = {
  id: '66666666-6666-6666-6666-666666666666',
  organization_id: e2eOrgB.id,
  name: 'E2E Customer B',
  code: 'CUST-B',
  email: 'custB@example.com',
};
