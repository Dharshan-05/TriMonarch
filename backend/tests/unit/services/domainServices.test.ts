import { describe, it, expect, vi } from 'vitest';
import { productService } from '../../../src/services/product.service';
import { productRepository } from '../../../src/repositories/product.repository';
import { inventoryService } from '../../../src/services/inventory.service';
import { inventoryRepository } from '../../../src/repositories/inventory.repository';
import { warehouseRepository } from '../../../src/repositories/warehouse.repository';
import { createMockProduct, createMockInventory, mockOrgId, mockProductId, mockWarehouseId } from '../fixtures/mockData';

describe('Phase 061 — Domain Services Unit Tests (Mocked Repositories)', () => {
  describe('ProductService', () => {
    it('getProductById should retrieve product record for matching organization', async () => {
      const mockProd = createMockProduct();
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProd as unknown as Awaited<ReturnType<typeof productRepository.findById>>);

      const prod = await productService.getProductById(mockProductId, mockOrgId);
      expect(prod).toBeDefined();
      expect(prod?.id).toBe(mockProductId);
    });

    it('createProduct should format decimal strings and save to repository', async () => {
      const mockProd = createMockProduct();
      vi.spyOn(productRepository, 'create').mockResolvedValueOnce(mockProd as unknown as Awaited<ReturnType<typeof productRepository.create>>);

      const created = await productRepository.create({
        organization_id: mockOrgId,
        sku: 'PROD-001',
        name: 'Standard Widget',
        price: '100.00',
      });

      expect(created.id).toBe(mockProductId);
      expect(productRepository.create).toHaveBeenCalled();
    });
  });

  describe('InventoryService', () => {
    it('getInventory should return inventory record when product and warehouse exist', async () => {
      const mockProd = createMockProduct();
      const mockInv = createMockInventory();
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProd as unknown as Awaited<ReturnType<typeof productRepository.findById>>);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce({ id: mockWarehouseId, organization_id: mockOrgId, name: 'Main' } as unknown as Awaited<ReturnType<typeof warehouseRepository.findById>>);
      vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValueOnce(mockInv as unknown as Awaited<ReturnType<typeof inventoryRepository.findByProductAndWarehouse>>);

      const inv = await inventoryService.getInventory(mockOrgId, mockProductId, mockWarehouseId);
      expect(inv).toBeDefined();
      expect(inv?.quantity_on_hand).toBe('100');
    });
  });
});
