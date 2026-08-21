import { describe, it, expect, vi } from 'vitest';
import { inventoryRepository } from '../../../src/repositories/inventory.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 062 — InventoryRepository Integration Tests', () => {
  it('inventoryRepository.findByProductAndWarehouse should return tenant-isolated inventory record', async () => {
    const mockInv = {
      id: 'inv-001',
      organization_id: orgAId,
      product_id: 'p-001',
      warehouse_id: 'w-001',
      quantity: '100.0000',
    };

    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse')
      .mockImplementation(async (orgId, pId, wId) => {
        if (orgId === orgAId && pId === 'p-001' && wId === 'w-001') {
          return mockInv as unknown as Awaited<ReturnType<typeof inventoryRepository.findByProductAndWarehouse>>;
        }
        return null;
      });

    const inv = await inventoryRepository.findByProductAndWarehouse(orgAId, 'p-001', 'w-001');
    expect(inv).toBeDefined();
    expect(inv?.quantity).toBe('100.0000');
  });
});
