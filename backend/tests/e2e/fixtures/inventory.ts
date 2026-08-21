import { e2eOrgA } from './organizations';
import { e2eComponentA } from './products';
import { e2eWarehouseA } from './warehouses';

export const e2eInventoryRawA = {
  id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  organization_id: e2eOrgA.id,
  product_id: e2eComponentA.id,
  warehouse_id: e2eWarehouseA.id,
  quantity: '500.0000',
};
