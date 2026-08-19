import { describe, it, expect, vi } from 'vitest';
import { stockReservationService } from '../src/services/stockReservation.service';
import { stockReservationRepository } from '../src/repositories/stockReservation.repository';
import { inventoryRepository } from '../src/repositories/inventory.repository';
import { productRepository } from '../src/repositories/product.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { stockLedgerRepository } from '../src/repositories/stockLedger.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  InsufficientAvailableStockError,
  InvalidReservationQuantityError,
  InvalidReservationStateTransitionError,
  ReservationAlreadyConsumedError,
  ReservationAlreadyReleasedError,
  ReservationNotFoundError,
} from '../src/types';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('Stock Reservation Engine Subsystem (Phase 022)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const prodId = '44444444-4444-4444-4444-444444444444';
  const whId = '55555555-5555-5555-5555-555555555555';
  const resId = '66666666-6666-6666-6666-666666666666';
  const invId = '77777777-7777-7777-7777-777777777777';

  const mockProduct = {
    id: prodId,
    organization_id: orgAId,
    sku: 'PROD-200',
    name: 'Reservable Widget',
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
    name: 'Reservations Warehouse',
    code: 'WH-RES',
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

  const mockReservation = {
    id: resId,
    organization_id: orgAId,
    product_id: prodId,
    warehouse_id: whId,
    quantity: '25.1250',
    status: 'active' as const,
    reference_type: 'sales_order',
    reference_id: '10000000-0000-0000-0000-000000000100',
    expires_at: null,
    notes: 'Order reservation',
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

  describe('Available Stock & Reservation Creation', () => {
    it('should calculate available stock using exact decimal arithmetic (on_hand - active_reserved)', async () => {
      vi.spyOn(inventoryRepository, 'findByProductAndWarehouse').mockResolvedValueOnce(mockInventory); // on_hand = 100.3500
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('25.1250');

      const available = await stockReservationService.getAvailableQuantity(orgAId, prodId, whId);
      expect(available).toBe('75.2250');
    });

    it('should reserve stock without physically decreasing inventory on-hand quantity', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // 100.3500
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('0.0000');
      const createResSpy = vi.spyOn(stockReservationRepository, 'create').mockResolvedValueOnce(mockReservation);
      const invUpdateSpy = vi.spyOn(inventoryRepository, 'updateQuantity');
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-res-1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'INVENTORY',
        entity_id: resId,
        request_id: 'req-res-1',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await stockReservationService.reserveStock(
        {
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '25.1250',
          reference_type: 'sales_order',
          reference_id: '10000000-0000-0000-0000-000000000100',
        },
        userAId,
        'req-res-1',
      );

      expect(res.id).toBe(resId);
      expect(createResSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          quantity: '25.1250',
          status: 'active',
        }),
        mockClient,
      );
      // On-hand inventory quantity MUST NOT be updated during reservation!
      expect(invUpdateSpy).not.toHaveBeenCalled();
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entity_type: 'INVENTORY',
        }),
        mockClient,
      );
    });

    it('should throw InsufficientAvailableStockError when requested quantity exceeds available stock', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // on_hand = 100.3500
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('80.0000'); // available = 20.3500

      await expect(
        stockReservationService.reserveStock({
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '50.0000', // exceeds 20.3500
        }),
      ).rejects.toThrow(InsufficientAvailableStockError);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject zero or negative reservation quantity', async () => {
      await expect(
        stockReservationService.reserveStock({
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '0.0000',
        }),
      ).rejects.toThrow(InvalidReservationQuantityError);

      await expect(
        stockReservationService.reserveStock({
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '-10.0000',
        }),
      ).rejects.toThrow(InvalidReservationQuantityError);
    });

    it('should roll back reservation creation if audit logging fails', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory);
      vi.spyOn(stockReservationRepository, 'getSumActiveQuantity').mockResolvedValueOnce('0.0000');
      vi.spyOn(stockReservationRepository, 'create').mockResolvedValueOnce(mockReservation);
      vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(new Error('Audit DB Fail'));

      await expect(
        stockReservationService.reserveStock(
          {
            organization_id: orgAId,
            product_id: prodId,
            warehouse_id: whId,
            quantity: '25.1250',
          },
          userAId,
        ),
      ).rejects.toThrow('Audit DB Fail');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Reservation Lifecycle & State Machine', () => {
    it('should release active reservation without modifying inventory quantity', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(stockReservationRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockReservation);
      vi.spyOn(stockReservationRepository, 'update').mockResolvedValueOnce({ ...mockReservation, status: 'released' });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-rel',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'INVENTORY',
        entity_id: resId,
        request_id: 'req-rel',
        success: true,
        metadata: {},
        created_at: new Date(),
      });
      const invUpdateSpy = vi.spyOn(inventoryRepository, 'updateQuantity');

      const released = await stockReservationService.releaseReservation(orgAId, resId, userAId, 'req-rel');

      expect(released.status).toBe('released');
      expect(invUpdateSpy).not.toHaveBeenCalled();
    });

    it('should consume active reservation and physically decrease inventory on-hand stock', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(stockReservationRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockReservation); // qty = 25.1250
      vi.spyOn(inventoryRepository, 'lockForUpdate').mockResolvedValueOnce(mockInventory); // on_hand = 100.3500
      const invUpdateSpy = vi.spyOn(inventoryRepository, 'updateQuantity').mockResolvedValueOnce({ ...mockInventory, quantity: '75.2250' });
      const ledgerSpy = vi.spyOn(stockLedgerRepository, 'create').mockResolvedValueOnce({
        id: 'led-con',
        organization_id: orgAId,
        product_id: prodId,
        warehouse_id: whId,
        movement_type: 'OUT',
        quantity: '-25.1250',
        unit: 'pcs',
        reference_type: 'sales_order',
        reference_id: '10000000-0000-0000-0000-000000000100',
        notes: null,
        created_at: new Date(),
      });
      vi.spyOn(stockReservationRepository, 'update').mockResolvedValueOnce({ ...mockReservation, status: 'consumed' });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-con',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'INVENTORY',
        entity_id: resId,
        request_id: 'req-con',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const consumed = await stockReservationService.consumeReservation(orgAId, resId, userAId, 'req-con');

      expect(consumed.status).toBe('consumed');
      // On-hand inventory quantity IS decreased upon consumption! (100.3500 - 25.1250 = 75.2250)
      expect(invUpdateSpy).toHaveBeenCalledWith(orgAId, invId, '75.2250', mockClient);
      expect(ledgerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          movement_type: 'OUT',
          quantity: '-25.1250',
        }),
        mockClient,
      );
    });

    it('should reject invalid state transitions from terminal states', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const consumedRes = { ...mockReservation, status: 'consumed' as const };
      vi.spyOn(stockReservationRepository, 'lockByIdForUpdate').mockResolvedValueOnce(consumedRes);

      await expect(stockReservationService.releaseReservation(orgAId, resId, userAId)).rejects.toThrow(
        ReservationAlreadyConsumedError,
      );

      const releasedRes = { ...mockReservation, status: 'released' as const };
      vi.spyOn(stockReservationRepository, 'lockByIdForUpdate').mockResolvedValueOnce(releasedRes);

      await expect(stockReservationService.consumeReservation(orgAId, resId, userAId)).rejects.toThrow(
        ReservationAlreadyReleasedError,
      );

      const cancelledRes = { ...mockReservation, status: 'cancelled' as const };
      vi.spyOn(stockReservationRepository, 'lockByIdForUpdate').mockResolvedValueOnce(cancelledRes);

      await expect(stockReservationService.expireReservation(orgAId, resId, userAId)).rejects.toThrow(
        InvalidReservationStateTransitionError,
      );
    });
  });

  describe('Security, Tenant Isolation & Sort Allowlist', () => {
    it('should enforce tenant isolation (Org B denied access to Org A reservation)', async () => {
      vi.spyOn(stockReservationRepository, 'findById').mockImplementation(async (orgId, id) => {
        if (orgId === orgAId && id === resId) return mockReservation;
        return null;
      });

      await expect(stockReservationService.getReservationById(orgBId, resId)).rejects.toThrow(ReservationNotFoundError);
    });

    it('should reject malicious sort parameters', () => {
      expect(() =>
        sanitizeSortColumn('created_at; DROP TABLE users', [
          'created_at',
          'quantity',
          'status',
        ]),
      ).toThrow(ValidationError);
    });
  });
});
