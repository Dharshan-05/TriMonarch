import { e2eOrgA, e2eOrgB } from './organizations';

export const e2eProductA = {
  id: '99999999-9999-9999-9999-999999999999',
  organization_id: e2eOrgA.id,
  sku: 'E2E-PROD-A',
  name: 'E2E Finished Product A',
  price: '150.0000',
  cost: '80.0000',
};

export const e2eComponentA = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  organization_id: e2eOrgA.id,
  sku: 'E2E-RAW-A',
  name: 'E2E Raw Material A',
  price: '20.0000',
  cost: '10.0000',
};

export const e2eProductB = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  organization_id: e2eOrgB.id,
  sku: 'E2E-PROD-B',
  name: 'E2E Product B',
  price: '200.0000',
  cost: '100.0000',
};
