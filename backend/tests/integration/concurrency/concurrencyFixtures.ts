import { orgAId, orgBId, userAId, userBId } from '../fixtures/database';

export { orgAId, orgBId, userAId, userBId };

export const createConcurrentMockProduct = (sku = 'CONC-PROD-001') => ({
  id: 'conc-prod-001',
  organization_id: orgAId,
  sku,
  name: 'Concurrent Test Product',
  price: '100.00',
  cost: '50.00',
  status: 'active',
});

export const createConcurrentMockInventory = (qty = '100.0000') => ({
  id: 'conc-inv-001',
  organization_id: orgAId,
  product_id: 'conc-prod-001',
  warehouse_id: 'conc-wh-001',
  quantity: qty,
});
