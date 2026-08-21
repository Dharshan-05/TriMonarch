import { e2eOrgA, e2eOrgB } from './organizations';

export const e2eWarehouseA = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  organization_id: e2eOrgA.id,
  code: 'WH-A',
  name: 'E2E Main Warehouse A',
};

export const e2eWarehouseB = {
  id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  organization_id: e2eOrgB.id,
  code: 'WH-B',
  name: 'E2E Main Warehouse B',
};
