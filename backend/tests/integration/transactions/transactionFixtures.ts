import { orgAId, orgBId, userAId, userBId } from '../fixtures/database';

export { orgAId, orgBId, userAId, userBId };

export const createTransactionMockProduct = () => ({
  id: 'trans-prod-001',
  organization_id: orgAId,
  sku: 'TX-PROD-001',
  name: 'Transaction Test Product',
  price: '100.00',
  cost: '50.00',
  status: 'active',
});

export const createTransactionMockInventory = () => ({
  id: 'trans-inv-001',
  organization_id: orgAId,
  product_id: 'trans-prod-001',
  warehouse_id: 'trans-wh-001',
  quantity: '100.0000',
});
