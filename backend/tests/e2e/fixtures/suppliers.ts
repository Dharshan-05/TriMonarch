import { e2eOrgA, e2eOrgB } from './organizations';

export const e2eSupplierA = {
  id: '77777777-7777-7777-7777-777777777777',
  organization_id: e2eOrgA.id,
  name: 'E2E Supplier A',
  code: 'SUPP-A',
  email: 'suppA@example.com',
};

export const e2eSupplierB = {
  id: '88888888-8888-8888-8888-888888888888',
  organization_id: e2eOrgB.id,
  name: 'E2E Supplier B',
  code: 'SUPP-B',
  email: 'suppB@example.com',
};
