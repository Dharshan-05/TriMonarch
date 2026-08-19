import { describe, it, expect, vi } from 'vitest';
import { inventoryService } from '../src/services/inventory.service';
import { inventoryRepository } from '../src/repositories/inventory.repository';
import { productRepository } from '../src/repositories/product.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { stockLedgerRepository } from '../src/repositories/stockLedger.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  ProductNotFoundError,
  WarehouseNotFoundError,
  InsufficientStockError,
  NegativeStockError,
  InvalidInventoryQuantityError,
} from '../src/types';
import { PoolClient } from 'pg';

describe('Inventory Core Engine Subsystem (Phase 021)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const prodId = '44444444-4444-4444-4444-444444444444';
  const whId = '55555555-5555-5555-5555-555555555555';
  const invId = '77777777-7777-7777-7777-777777777777';

  const mockProduct = {
    id: prodId,
    organization_id: orgAId,
    sku: 'PROD-100',
    name: 'Test Product',
    description: null,
    category: null,
    unit: 'pcs',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockWarehouse = {
    id: whId,
    organization_id: orgAId,
    name: 'Main Warehouse',
    code: 'WH-MAIN',
    location: null,
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockInventory = {
    id: invId,
    organization_id: orgAId,
    product_id: prodId,
    warehouse_id: whId,
    quantity: '10.5000',
    reorder_level: '2.0000',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createMockPoolClient = () => {
    const mockQuery = vi.fn().mockImplementation(async (sql: string) => {
      return { rows: [], rowCount: 1, command: sql, oid: 0, fields: [] };
    });
    const mockRelease = vi.fn();
    return {
      query: mockQuery,
      release: mockRelease,
    } as unknown as PoolClient;
  };

  describe('Inventory Retrieval & Available Quantity', () => {
    it('should retrieve inventory and calculate exact decimal available quantity', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValueOnce(mockInventory);

      const qty = await inventoryService.getAvailableQuantity(orgAId, prodId, whId);
      expect(qty).toBe('10.5000');
    });

    it('should return 0.0000 when inventory record does not exist yet', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValueOnce(null);

      const qty = await inventoryService.getAvailableQuantity(orgAId, prodId, whId);
      expect(qty).toBe('0.0000');
    });

    it('should enforce tenant isolation (reject cross-tenant lookup)', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(null);
      await expect(inventoryService.getInventory(orgBId, prodId, whId)).rejects.toThrow(ProductNotFoundError);
    });
  });

  describe('Increase Stock Workflow', () => {
    it('should atomically increase stock with exact decimal addition, ledger, and audit creation', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory);

      const updatedInv = { ...mockInventory, quantity: '15.7500' };
      vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValueOnce(updatedInv);
      const ledgerSpy = vi.spyOn(stockLedgerRepository, 'create').mockResolvedValueOnce({
        id: 'led-1',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'IN',
        quantity: '5.2500',
        unit: 'pcs',
        reference_type: 'PO',
        reference_id: 'po-1',
        notes: null,
        created_at: new Date(),
      });
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'INVENTORY',
        entity_id: invId,
        request_id: 'req-inc',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await inventoryService.increaseStock(
        {
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '5.2500',
          reference_type: 'PO',
          reference_id: 'po-1',
        },
        userAId,
        'req-inc',
      );

      expect(res.quantity).toBe('15.7500');
      expect(inventoryRepository.updateQuantity).toHaveBeenCalledWith(orgAId, invId, '15.7500', mockClient);
      expect(ledgerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          movement_type: 'IN',
          quantity: '5.2500',
          reference_type: 'PO',
        }),
        mockClient,
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entity_type: 'INVENTORY',
        }),
        mockClient,
      );
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw WarehouseNotFoundError if warehouse does not exist', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(null);
      await expect(
        inventoryService.increaseStock({
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: '88888888-8888-8888-8888-888888888888',
          quantity: '5.0000',
        }),
      ).rejects.toThrow(WarehouseNotFoundError);
    });

    it('should reject zero or negative quantity for stock increase', async () => {
      await expect(
        inventoryService.increaseStock({
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '0.0000',
        }),
      ).rejects.toThrow(InvalidInventoryQuantityError);

      await expect(
        inventoryService.increaseStock({
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '-5.0000',
        }),
      ).rejects.toThrow(InvalidInventoryQuantityError);
    });

    it('should roll back inventory increase if ledger creation fails', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory);
      vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValueOnce({ ...mockInventory, quantity: '15.0000' });
      vi.spyOn(stockLedgerRepository, 'create').mockRejectedValueOnce(new Error('Ledger insertion error'));

      await expect(
        inventoryService.increaseStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            quantity: '4.5000',
          },
          userAId,
        ),
      ).rejects.toThrow('Ledger insertion error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Decrease Stock Workflow & Negative Stock Guard', () => {
    it('should atomically decrease stock with exact decimal subtraction', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory);

      const updatedInv = { ...mockProduct, quantity: '5.2500' } as unknown as typeof mockInventory;
      vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValueOnce(updatedInv);
      vi.spyOn(stockLedgerRepository, 'create').mockResolvedValueOnce({
        id: 'led-dec',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'OUT',
        quantity: '-5.2500',
        unit: 'pcs',
        reference_type: 'SO',
        reference_id: 'so-1',
        notes: null,
        created_at: new Date(),
      });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-dec',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'INVENTORY',
        entity_id: invId,
        request_id: 'req-dec',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await inventoryService.decreaseStock(
        {
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '5.2500',
        },
        userAId,
        'req-dec',
      );

      expect(res.quantity).toBe('5.2500');
      expect(inventoryRepository.updateQuantity).toHaveBeenCalledWith(orgAId, invId, '5.2500', mockClient);
    });

    it('should throw InsufficientStockError when requested quantity exceeds available stock', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // current: 10.5000

      await expect(
        inventoryService.decreaseStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            quantity: '20.0000',
          },
          userAId,
        ),
      ).rejects.toThrow(InsufficientStockError);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Adjustment Workflow', () => {
    it('should adjust stock via target_quantity or delta_quantity safely', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // current 10.5000

      const adjustedInv = { ...mockInventory, quantity: '12.0000' };
      vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValueOnce(adjustedInv);
      vi.spyOn(stockLedgerRepository, 'create').mockResolvedValueOnce({
        id: 'led-adj',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'ADJUSTMENT',
        quantity: '1.5000',
        unit: 'pcs',
        reference_type: 'MANUAL',
        reference_id: null,
        notes: 'Stock count adjustment',
        created_at: new Date(),
      });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-adj',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'INVENTORY',
        entity_id: invId,
        request_id: 'req-adj',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await inventoryService.adjustStock(
        {
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          target_quantity: '12.0000',
          notes: 'Stock count adjustment',
        },
        userAId,
        'req-adj',
      );

      expect(res.quantity).toBe('12.0000');
    });

    it('should reject adjustments resulting in negative inventory balance', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // current 10.5000

      await expect(
        inventoryService.adjustStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            delta_quantity: '-15.0000',
          },
          userAId,
        ),
      ).rejects.toThrow(NegativeStockError);
    });
  });
});
