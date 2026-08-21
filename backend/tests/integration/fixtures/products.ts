import { orgAId, orgBId } from './database';

export const createTestProductOrgAData = (overrides?: Record<string, unknown>) => ({
  id: '55555555-5555-5555-5555-555555555555',
  organization_id: orgAId,
  sku: 'PROD-ORG-A-001',
  name: 'Org A Product',
  price: '199.99',
  cost: '99.99',
  status: 'active',
  ...overrides,
});

export const createTestProductOrgBData = (overrides?: Record<string, unknown>) => ({
  id: '66666666-6666-6666-6666-666666666666',
  organization_id: orgBId,
  sku: 'PROD-ORG-B-001',
  name: 'Org B Product',
  price: '299.99',
  cost: '149.99',
  status: 'active',
  ...overrides,
});
