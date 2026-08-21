import { e2eOrgA } from './organizations';
import { e2eProductA, e2eComponentA } from './products';

export const e2eBomA = {
  id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  organization_id: e2eOrgA.id,
  product_id: e2eProductA.id,
  bom_number: 'BOM-E2E-PROD-A',
  revision: '1.0',
  status: 'active',
  items: [
    {
      component_product_id: e2eComponentA.id,
      quantity: '2.0000',
    },
  ],
};
