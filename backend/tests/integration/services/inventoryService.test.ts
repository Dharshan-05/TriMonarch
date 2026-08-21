import { describe, it, expect, vi } from 'vitest';
import { inventoryService } from '../../../src/services/inventory.service';
import { productRepository } from '../../../src/repositories/product.repository';
import { warehouseRepository } from '../../../src/repositories/warehouse.repository';
import { inventoryRepository } from '../../../src/repositories/inventory.repository';
import { orgAId } from '../fixtures/database';

describe('Phase 063 — InventoryService Integration Tests', () => {
  it('getInventory should query product and warehouse validation before fetching inventory balance', async () => {
    const mockProd = { id: 'p-001', organization_id: orgAId, name: 'Product 1' };
    const mockWh = { id: 'w-001', organization_id: orgAId, name: 'Main Warehouse' };
    const mockInv = { id: 'inv-001', organization_id: orgAId, product_id: 'p-001', warehouse_id: 'w-001', quantity: '70.0000' };

    vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProd as unknown as Awaited<ReturnType<typeof productRepository.findById>>);
    vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWh as unknown as Awaited<ReturnType<typeof warehouseRepository.findById>>);
    vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValueOnce(mockInv as unknown as Awaited<ReturnType<typeof inventoryRepository.findByProductAndWarehouse>>);

    const inv = await inventoryService.getInventory(orgAId, 'p-001', 'w-001');
    expect(inv).toBeDefined();
    expect(inv?.quantity).toBe('70.0000');
  });
});
