import { describe, it, expect, vi } from 'vitest';
import { inventoryService } from '../src/services/inventory.service';
import { stockReservationService } from '../src/services/stockReservation.service';
import { stockAdjustmentService } from '../src/services/stockAdjustment.service';
import { inventoryRepository } from '../src/repositories/inventory.repository';
import { productRepository } from '../src/repositories/product.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { stockLedgerRepository } from '../src/repositories/stockLedger.repository';
import { stockReservationRepository } from '../src/repositories/stockReservation.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { Inventory } from '../src/types/database';
import {
  InsufficientStockError,
  InsufficientAvailableStockError,
  AdjustmentWouldViolateReservationError,
  ReservationAlreadyConsumedError,
} from '../src/types';
import { PoolClient } from 'pg';

describe('Inventory Concurrency Control Engine Subsystem (Phase 024)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const prodId = '44444444-4444-4444-4444-444444444444';
  const whId = '55555555-5555-5555-5555-555555555555';
  const resId = '66666666-6666-6666-6666-666666666666';
  const invId = '77777777-7777-7777-7777-777777777777';

  const mockProduct = {
    id: prodId,
    organization_id: orgAId,
    sku: 'PROD-CONCURRENCY',
    name: 'Concurrent Widget',
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
    name: 'Concurrency Warehouse',
    code: 'WH-CONCURRENCY',
    location: null,
    status: 'active' as const,
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

  describe('TEST 1 & 2: Concurrent Stock Decreases & Increases (Lost Update Prevention)', () => {
    it('TEST 2 — Concurrent stock increases must accumulate all deltas without lost updates', async () => {
      const mockClient1 = createMockPoolClient();
      const mockClient2 = createMockPoolClient();

      vi.spyOn(pool, 'connect')
        .mockResolvedValueOnce(mockClient1)
        .mockResolvedValueOnce(mockClient2);

      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);

      let currentQty = 100;
      let lockChain = Promise.resolve();

      vi.spyOn(inventoryRepository, 'ensureInventoryRowLocked').mockImplementation(async () => {
        let release: () => void = () => {};
        const prev = lockChain;
        lockChain = new Promise<void>((res) => {
          release = res;
        });
        await prev;

        setTimeout(release, 5);

        return {
          id: invId,
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: String(currentQty),
          reorder_level: '0.0000',
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      vi.spyOn(inventoryRepository, 'updateQuantity').mockImplementation(async (orgId, id, qty) => {
        currentQty = parseFloat(String(qty));
        return {
          id: invId,
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: String(currentQty),
          reorder_level: '0.0000',
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      vi.spyOn(stockLedgerRepository, 'create').mockResolvedValue({
        id: 'led-1',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'IN',
        quantity: '25.0000',
        unit: 'pcs',
        reference_type: null,
        reference_id: null,
        notes: null,
        created_at: new Date(),
      });

      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue({
        id: 'aud-1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'INVENTORY',
        entity_id: invId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const p1 = inventoryService.increaseStock({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '25.0000',
      });

      const p2 = inventoryService.increaseStock({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '30.0000',
      });

      const [res1, res2] = await Promise.all([p1, p2]);

      expect(parseFloat(String(res1.quantity)) + parseFloat(String(res2.quantity))).toBeGreaterThan(0);
      expect(currentQty).toBe(155); // 100 + 25 + 30 = 155
    });

    it('TEST 1 — Concurrent stock decreases must prevent overselling and negative stock', async () => {
      const mockClient1 = createMockPoolClient();
      const mockClient2 = createMockPoolClient();

      vi.spyOn(pool, 'connect')
        .mockResolvedValueOnce(mockClient1)
        .mockResolvedValueOnce(mockClient2);

      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);

      let currentStock = 100;
      let lockChain = Promise.resolve();

      vi.spyOn(inventoryRepository, 'lockForUpdate').mockImplementation(async () => {
        let release: () => void = () => {};
        const prev = lockChain;
        lockChain = new Promise<void>((res) => {
          release = res;
        });
        await prev;
        setTimeout(release, 5);

        return {
          id: invId,
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: String(currentStock),
          reorder_level: '0.0000',
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      vi.spyOn(inventoryRepository, 'updateQuantity').mockImplementation(async (orgId, id, qty) => {
        currentStock = parseFloat(String(qty));
        return {
          id: invId,
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: String(currentStock),
          reorder_level: '0.0000',
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      vi.spyOn(stockLedgerRepository, 'create').mockResolvedValue({
        id: 'led-dec',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'OUT',
        quantity: '-70.0000',
        unit: 'pcs',
        reference_type: null,
        reference_id: null,
        notes: null,
        created_at: new Date(),
      });

      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue({
        id: 'aud-dec',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'INVENTORY',
        entity_id: invId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const p1 = inventoryService.decreaseStock({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '70.0000',
      });

      const p2 = inventoryService.decreaseStock({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '50.0000',
      });

      const results = await Promise.allSettled([p1, p2]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientStockError);
      expect(currentStock).toBeGreaterThanOrEqual(0); // Never negative!
    });
  });

  describe('TEST 3 & 4: Concurrent Reservations & Double Consumption Prevention', () => {
    it('TEST 3 — Concurrent reservations must not over-reserve available stock', async () => {
      const mockClient1 = createMockPoolClient();
      const mockClient2 = createMockPoolClient();

      vi.spyOn(pool, 'connect')
        .mockResolvedValueOnce(mockClient1)
        .mockResolvedValueOnce(mockClient2);

      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);

      let lockChain = Promise.resolve();

      vi.spyOn(inventoryRepository, 'ensureInventoryRowLocked').mockImplementation(async () => {
        let release: () => void = () => {};
        const prev = lockChain;
        lockChain = new Promise<void>((res) => {
          release = res;
        });
        await prev;
        setTimeout(release, 5);

        return {
          id: invId,
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '100.0000',
          reorder_level: '0.0000',
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      let totalReserved = 20;
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockImplementation(async () => {
        return String(totalReserved);
      });

      vi.spyOn(stockReservationRepository, 'create').mockImplementation(async (data) => {
        totalReserved += parseFloat(String(data.quantity));
        return {
          id: 'res-new',
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: String(data.quantity),
          status: 'active' as const,
          reference_type: null,
          reference_id: null,
          expires_at: null,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue({
        id: 'aud-res',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'INVENTORY',
        entity_id: 'res-new',
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const p1 = stockReservationService.reserveStock({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '60.0000',
      });

      const p2 = stockReservationService.reserveStock({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '40.0000',
      });

      const results = await Promise.allSettled([p1, p2]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientAvailableStockError);
      expect(totalReserved).toBeLessThanOrEqual(100);
    });

    it('TEST 4 — Concurrent reservation consumption must prevent double consumption', async () => {
      const mockClient1 = createMockPoolClient();
      const mockClient2 = createMockPoolClient();

      vi.spyOn(pool, 'connect')
        .mockResolvedValueOnce(mockClient1)
        .mockResolvedValueOnce(mockClient2);

      let resStatus: 'active' | 'consumed' = 'active';
      let lockChain = Promise.resolve();

      vi.spyOn(stockReservationRepository, 'lockByIdForUpdate').mockImplementation(async () => {
        let release: () => void = () => {};
        const prev = lockChain;
        lockChain = new Promise<void>((res) => {
          release = res;
        });
        await prev;
        setTimeout(release, 5);

        return {
          id: resId,
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '25.0000',
          status: resStatus,
          reference_type: null,
          reference_id: null,
          expires_at: null,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      vi.spyOn(inventoryRepository, 'ensureInventoryRowLocked').mockResolvedValue({
        id: invId,
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '100.0000',
        reorder_level: '0.0000',
        created_at: new Date(),
        updated_at: new Date(),
      });

      let consumeCount = 0;
      vi.spyOn(stockReservationRepository, 'update').mockImplementation(async (orgId, id, data) => {
        if (data.status === 'consumed') {
          resStatus = 'consumed';
          consumeCount++;
        }
        return {
          id: resId,
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '25.0000',
          status: resStatus,
          reference_type: null,
          reference_id: null,
          expires_at: null,
          notes: null,
          created_at: new Date(),
          updated_at: new Date(),
        };
      });

      vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValue({
        id: invId,
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '75.0000',
        reorder_level: '0.0000',
        created_at: new Date(),
        updated_at: new Date(),
      });

      vi.spyOn(stockLedgerRepository, 'create').mockResolvedValue({
        id: 'led-out',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'OUT',
        quantity: '-25.0000',
        unit: 'pcs',
        reference_type: 'reservation',
        reference_id: resId,
        notes: null,
        created_at: new Date(),
      });

      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue({
        id: 'aud-con',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'INVENTORY',
        entity_id: resId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const p1 = stockReservationService.consumeReservation(orgAId, resId, userAId);
      const p2 = stockReservationService.consumeReservation(orgAId, resId, userAId);

      const results = await Promise.allSettled([p1, p2]);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');

      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(ReservationAlreadyConsumedError);
      expect(consumeCount).toBe(1); // Reservation consumed EXACTLY ONCE!
    });
  });

  describe('TEST 5 & 6: Concurrent Adjustment vs Reservation & Decrease Protection', () => {
    it('TEST 5 — Concurrent adjustment must not violate active reservations', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);

      vi.spyOn(inventoryRepository, 'ensureInventoryRowLocked').mockResolvedValue({
        id: invId,
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '100.0000',
        reorder_level: '0.0000',
        created_at: new Date(),
        updated_at: new Date(),
      });

      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValue('80.0000');

      await expect(
        stockAdjustmentService.adjustStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            delta_quantity: '-30.0000',
          },
          userAId,
        ),
      ).rejects.toThrow(AdjustmentWouldViolateReservationError);
    });
  });

  describe('TEST 7 & 10: Atomic Missing-Row Creation & Rollback Under Contention', () => {
    it('TEST 7 — Concurrent creation of missing inventory row must create exactly one row', async () => {
      const mockClient1 = createMockPoolClient();
      const mockClient2 = createMockPoolClient();

      vi.spyOn(pool, 'connect')
        .mockResolvedValueOnce(mockClient1)
        .mockResolvedValueOnce(mockClient2);

      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);

      let createdCount = 0;
      let inventoryRow: typeof mockProduct & { quantity: string } | null = null;
      let lockChain = Promise.resolve();

      vi.spyOn(inventoryRepository, 'ensureInventoryRowLocked').mockImplementation(async () => {
        let release: () => void = () => {};
        const prev = lockChain;
        lockChain = new Promise<void>((res) => {
          release = res;
        });
        await prev;
        setTimeout(release, 5);

        if (!inventoryRow) {
          createdCount++;
          inventoryRow = {
            id: invId,
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            sku: 'PROD-CONCURRENCY',
            name: 'Concurrent Widget',
            description: null,
            category: null,
            unit: 'pcs',
            status: 'active' as const,
            quantity: '0.0000',
            created_at: new Date(),
            updated_at: new Date(),
          };
        }
        return inventoryRow as unknown as Inventory;
      });

      vi.spyOn(inventoryRepository, 'updateQuantity').mockImplementation(async (orgId, id, qty) => {
        inventoryRow!.quantity = String(qty);
        return inventoryRow as unknown as Inventory;
      });

      vi.spyOn(stockLedgerRepository, 'create').mockResolvedValue({
        id: 'led-1',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'IN',
        quantity: '10.0000',
        unit: 'pcs',
        reference_type: null,
        reference_id: null,
        notes: null,
        created_at: new Date(),
      });

      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue({
        id: 'aud-1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'INVENTORY',
        entity_id: invId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const p1 = inventoryService.increaseStock({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '10.0000',
      });

      const p2 = inventoryService.increaseStock({
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '20.0000',
      });

      await Promise.all([p1, p2]);

      expect(createdCount).toBe(1); // EXACTLY ONE ROW CREATED!
      expect(inventoryRow!.quantity).toBe('30.0000'); // 10 + 20 = 30
    });

    it('TEST 10 — Ledger/audit failure must roll back inventory mutation cleanly', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValue(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValue(mockWarehouse);

      vi.spyOn(inventoryRepository, 'ensureInventoryRowLocked').mockResolvedValue({
        id: invId,
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '100.0000',
        reorder_level: '0.0000',
        created_at: new Date(),
        updated_at: new Date(),
      });

      vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValue({
        id: invId,
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        quantity: '110.0000',
        reorder_level: '0.0000',
        created_at: new Date(),
        updated_at: new Date(),
      });

      vi.spyOn(stockLedgerRepository, 'create').mockResolvedValue({
        id: 'led-1',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'IN',
        quantity: '10.0000',
        unit: 'pcs',
        reference_type: null,
        reference_id: null,
        notes: null,
        created_at: new Date(),
      });

      vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(new Error('Audit DB Failure'));

      await expect(
        inventoryService.increaseStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            quantity: '10.0000',
          },
          userAId,
        ),
      ).rejects.toThrow('Audit DB Failure');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
