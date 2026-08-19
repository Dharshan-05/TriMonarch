import { describe, it, expect, vi } from 'vitest';
import { stockAdjustmentService } from '../src/services/stockAdjustment.service';
import { inventoryRepository } from '../src/repositories/inventory.repository';
import { productRepository } from '../src/repositories/product.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { stockLedgerRepository } from '../src/repositories/stockLedger.repository';
import { stockReservationRepository } from '../src/repositories/stockReservation.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  ZeroStockAdjustmentError,
  AdjustmentWouldViolateReservationError,
  ProductNotFoundError,
  WarehouseNotFoundError,
  NegativeStockError,
  ValidationError,
} from '../src/types';
import { PoolClient } from 'pg';

describe('Stock Adjustment Engine Subsystem (Phase 023)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const prodId = '44444444-4444-4444-4444-444444444444';
  const whId = '55555555-5555-5555-5555-555555555555';
  const invId = '77777777-7777-7777-7777-777777777777';

  const mockProduct = {
    id: prodId,
    organization_id: orgAId,
    sku: 'PROD-300',
    name: 'Adjustable Widget',
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
    name: 'Adjustments Warehouse',
    code: 'WH-ADJ',
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
    quantity: '100.3500',
    reorder_level: '5.0000',
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

  describe('Positive & Negative Stock Adjustments with Exact Decimal Arithmetic', () => {
    it('should process a positive stock adjustment with exact decimal arithmetic and ledger creation', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // on_hand = 100.3500
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('20.0000'); // reserved = 20.0000

      const updatedInv = { ...mockInventory, quantity: '125.8500' };
      const updateQtySpy = vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValueOnce(updatedInv);
      const ledgerSpy = vi.spyOn(stockLedgerRepository, 'create').mockResolvedValueOnce({
        id: 'led-adj-pos',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'ADJUSTMENT',
        quantity: '25.5000',
        unit: 'pcs',
        reference_type: 'adjustment',
        reference_id: null,
        notes: '[Reason: PHYSICAL_COUNT] Cycle count adjustment',
        created_at: new Date(),
      });
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-adj-pos',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'INVENTORY',
        entity_id: invId,
        request_id: 'req-pos',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await stockAdjustmentService.adjustStock(
        {
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          delta_quantity: '25.5000',
          reason: 'PHYSICAL_COUNT',
          notes: 'Cycle count adjustment',
        },
        userAId,
        'req-pos',
      );

      expect(res.new_quantity).toBe('125.8500');
      expect(res.adjustment_quantity).toBe('25.5000');
      expect(res.new_available_quantity).toBe('105.8500'); // 125.8500 - 20.0000
      expect(updateQtySpy).toHaveBeenCalledWith(orgAId, invId, '125.8500', mockClient);
      expect(ledgerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          movement_type: 'ADJUSTMENT',
          quantity: '25.5000',
        }),
        mockClient,
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entity_type: 'INVENTORY',
        }),
        mockClient,
      );
    });

    it('should process a valid negative stock adjustment with exact decimal arithmetic', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // on_hand = 100.3500
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('25.0000'); // reserved = 25.0000

      const updatedInv = { ...mockInventory, quantity: '90.2250' };
      vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValueOnce(updatedInv);
      vi.spyOn(stockLedgerRepository, 'create').mockResolvedValueOnce({
        id: 'led-adj-neg',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'ADJUSTMENT',
        quantity: '-10.1250',
        unit: 'pcs',
        reference_type: 'adjustment',
        reference_id: null,
        notes: '[Reason: DAMAGE] Damaged stock',
        created_at: new Date(),
      });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-adj-neg',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'INVENTORY',
        entity_id: invId,
        request_id: 'req-neg',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await stockAdjustmentService.adjustStock(
        {
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          delta_quantity: '-10.1250',
          reason: 'DAMAGE',
        },
        userAId,
        'req-neg',
      );

      expect(res.new_quantity).toBe('90.2250');
      expect(res.adjustment_quantity).toBe('-10.1250');
      expect(res.new_available_quantity).toBe('65.2250'); // 90.2250 - 25.0000
    });
  });

  describe('Critical Reservation Protection Guard', () => {
    it('should reject a negative adjustment that would violate active stock reservations', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const invWith100 = { ...mockInventory, quantity: '100.0000' };
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(invWith100); // on_hand = 100.0000
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('80.0000'); // active_reserved = 80.0000 (available = 20)

      const invUpdateSpy = vi.spyOn(inventoryRepository, 'updateQuantity');
      const ledgerSpy = vi.spyOn(stockLedgerRepository, 'create');
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent');

      // Attempt delta -30 (new_on_hand would be 70, which is < active_reserved 80)
      await expect(
        stockAdjustmentService.adjustStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            delta_quantity: '-30.0000',
            reason: 'LOSS',
          },
          userAId,
        ),
      ).rejects.toThrow(AdjustmentWouldViolateReservationError);

      // On-hand inventory MUST remain unchanged, no ledger entry, no audit event created!
      expect(invUpdateSpy).not.toHaveBeenCalled();
      expect(ledgerSpy).not.toHaveBeenCalled();
      expect(auditSpy).not.toHaveBeenCalled();
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Validation & Boundary Guards', () => {
    it('should reject zero stock adjustment delta', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory);
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('0.0000');

      await expect(
        stockAdjustmentService.adjustStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            delta_quantity: '0.0000',
          },
          userAId,
        ),
      ).rejects.toThrow(ZeroStockAdjustmentError);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject negative inventory balance resulting from adjustment', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // 100.3500
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('0.0000');

      await expect(
        stockAdjustmentService.adjustStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            delta_quantity: '-150.0000',
          },
          userAId,
        ),
      ).rejects.toThrow(NegativeStockError);
    });

    it('should reject payload with both delta_quantity and target_quantity', async () => {
      await expect(
        stockAdjustmentService.adjustStock({
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          delta_quantity: '10.0000',
          target_quantity: '110.0000',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Adjustment Preview & History', () => {
    it('should provide adjustment preview without mutating database', async () => {
      vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValueOnce(mockInventory); // on_hand = 100.3500
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('30.0000'); // reserved = 30.0000 (available = 70.3500)

      const allowedPreview = await stockAdjustmentService.getAdjustmentPreview(orgAId, prodId, whId, {
        delta_quantity: '-20.0000',
      });

      expect(allowedPreview.allowed).toBe(true);
      expect(allowedPreview.resulting_on_hand).toBe('80.3500');
      expect(allowedPreview.resulting_available).toBe('50.3500');

      vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValueOnce(mockInventory); // 100.3500
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('30.0000');

      const rejectedPreview = await stockAdjustmentService.getAdjustmentPreview(orgAId, prodId, whId, {
        delta_quantity: '-80.0000', // resulting on_hand = 20.3500 < active_reserved 30.0000
      });

      expect(rejectedPreview.allowed).toBe(false);
      expect(rejectedPreview.rejection_reason).toContain('active stock reservations');
    });

    it('should retrieve adjustment history filtered by movement_type = ADJUSTMENT', async () => {
      const historySpy = vi.spyOn(stockLedgerRepository, 'listByOrganization').mockResolvedValueOnce({
        items: [
          {
            id: 'led-adj-hist',
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            movement_type: 'ADJUSTMENT',
            quantity: '15.0000',
            unit: 'pcs',
            reference_type: 'adjustment',
            reference_id: null,
            notes: '[Reason: PHYSICAL_COUNT] History entry',
            created_at: new Date(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      });

      const res = await stockAdjustmentService.getAdjustmentHistory(orgAId, { productId: prodId });

      expect(res.total).toBe(1);
      expect(historySpy).toHaveBeenCalledWith(
        orgAId,
        expect.objectContaining({
          movementType: 'ADJUSTMENT',
          productId: prodId,
        }),
      );
    });
  });

  describe('Security & Tenant Isolation', () => {
    it('should enforce tenant isolation (Org B denied access to Org A product/warehouse)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(null);

      await expect(
        stockAdjustmentService.adjustStock(
          {
            organization_id: orgBId,
            product_id: prodId,
            warehouse_id: whId,
            delta_quantity: '10.0000',
          },
          userAId,
        ),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('should throw WarehouseNotFoundError if warehouse does not exist', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(null);

      await expect(
        stockAdjustmentService.adjustStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: '88888888-8888-8888-8888-888888888888',
            delta_quantity: '10.0000',
          },
          userAId,
        ),
      ).rejects.toThrow(WarehouseNotFoundError);
    });
  });
});
