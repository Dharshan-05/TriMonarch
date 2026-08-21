export const mockUserId = '11111111-1111-1111-1111-111111111111';
export const mockOrgId = '22222222-2222-2222-2222-222222222222';
export const mockPartnerId = '33333333-3333-3333-3333-333333333333';
export const mockProductId = '44444444-4444-4444-4444-444444444444';
export const mockWarehouseId = '55555555-5555-5555-5555-555555555555';
export const mockSalesOrderId = '66666666-6666-6666-6666-666666666666';
export const mockPurchaseOrderId = '77777777-7777-7777-7777-777777777777';
export const mockBomId = '88888888-8888-8888-8888-888888888888';
export const mockManufacturingOrderId = '99999999-9999-9999-9999-999999999999';

export const createMockUser = (overrides?: Record<string, unknown>) => ({
  id: mockUserId,
  organization_id: mockOrgId,
  email: 'user@example.com',
  name: 'John Doe',
  password_hash: '$2b$10$abcdefghijklmnopqrstuu',
  status: 'active',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockProduct = (overrides?: Record<string, unknown>) => ({
  id: mockProductId,
  organization_id: mockOrgId,
  sku: 'PROD-001',
  name: 'Standard Widget',
  description: 'A standard widget description',
  category: 'Widgets',
  unit: 'pcs',
  price: '100.00',
  cost: '50.00',
  tax_rate: '0.05',
  status: 'active',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockInventory = (overrides?: Record<string, unknown>) => ({
  id: 'inv-123',
  organization_id: mockOrgId,
  product_id: mockProductId,
  warehouse_id: mockWarehouseId,
  quantity_on_hand: '100',
  quantity_reserved: '10',
  reorder_level: '20',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockSalesOrder = (overrides?: Record<string, unknown>) => ({
  id: mockSalesOrderId,
  organization_id: mockOrgId,
  order_number: 'SO-1001',
  customer_id: mockPartnerId,
  status: 'draft',
  subtotal: '200.00',
  tax_total: '10.00',
  discount_total: '0.00',
  grand_total: '210.00',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockPurchaseOrder = (overrides?: Record<string, unknown>) => ({
  id: mockPurchaseOrderId,
  organization_id: mockOrgId,
  order_number: 'PO-1001',
  supplier_id: mockPartnerId,
  status: 'draft',
  subtotal: '500.00',
  tax_total: '25.00',
  grand_total: '525.00',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockBom = (overrides?: Record<string, unknown>) => ({
  id: mockBomId,
  organization_id: mockOrgId,
  product_id: mockProductId,
  bom_code: 'BOM-001',
  name: 'Widget Assembly BOM',
  status: 'active',
  version: 1,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const createMockManufacturingOrder = (overrides?: Record<string, unknown>) => ({
  id: mockManufacturingOrderId,
  organization_id: mockOrgId,
  order_number: 'MO-1001',
  product_id: mockProductId,
  bom_id: mockBomId,
  quantity: '50',
  status: 'draft',
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});
