import { describe, it, expect, vi } from 'vitest';
import { salesOrderStateMachineService } from '../src/services/salesOrderStateMachine.service';
import { salesOrderService } from '../src/services/salesOrder.service';
import { salesOrderRepository } from '../src/repositories/salesOrder.repository';
import { customerRepository } from '../src/repositories/customer.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  SalesOrderNotFoundError,
  InvalidSalesOrderStateTransitionError,
  SalesOrderAlreadyInStateError,
  SalesOrderMissingItemsError,
  ValidationError,
} from '../src/types';
import { PoolClient } from 'pg';

describe('Sales Order State Machine Subsystem (Phase 026)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const custId = '44444444-4444-4444-4444-444444444444';
  const prodId = '55555555-5555-5555-5555-555555555555';
  const orderId = '77777777-7777-7777-7777-777777777777';

  const mockCustomer = {
    id: custId,
    organization_id: orgAId,
    name: 'State Machine Customer',
    email: 'sm@acme.com',
    phone: null,
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockItem = {
    id: 'item-1',
    organization_id: orgAId,
    sales_order_id: orderId,
    product_id: prodId,
    quantity: '2.0000',
    unit_price: '15.0000',
    discount_amount: '0.0000',
    tax_rate: '0.000000',
    tax_amount: '0.0000',
    line_total: '30.0000',
    sequence: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockDraftOrder = {
    id: orderId,
    organization_id: orgAId,
    customer_id: custId,
    order_number: 'SO-STATE-100',
    order_date: new Date(),
    status: 'draft' as const,
    currency: 'USD',
    subtotal: '30.0000',
    tax_amount: '0.0000',
    discount_amount: '0.0000',
    total_amount: '30.0000',
    notes: null,
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

  describe('Transition Matrix & Helper Methods', () => {
    it('should correctly evaluate valid and invalid state transitions', () => {
      expect(salesOrderStateMachineService.canTransition('draft', 'confirmed')).toBe(true);
      expect(salesOrderStateMachineService.canTransition('draft', 'cancelled')).toBe(true);
      expect(salesOrderStateMachineService.canTransition('confirmed', 'processing')).toBe(true);
      expect(salesOrderStateMachineService.canTransition('processing', 'shipped')).toBe(true);
      expect(salesOrderStateMachineService.canTransition('shipped', 'completed')).toBe(true);

      // Invalid transitions
      expect(salesOrderStateMachineService.canTransition('draft', 'shipped')).toBe(false);
      expect(salesOrderStateMachineService.canTransition('shipped', 'cancelled')).toBe(false);
      expect(salesOrderStateMachineService.canTransition('completed', 'draft')).toBe(false);
      expect(salesOrderStateMachineService.canTransition('cancelled', 'confirmed')).toBe(false);
    });

    it('should return available transitions for a Sales Order', async () => {
      vi.spyOn(salesOrderRepository, 'findById').mockResolvedValueOnce(mockDraftOrder);

      const info = await salesOrderStateMachineService.getAvailableTransitions(orgAId, orderId);

      expect(info.current_status).toBe('draft');
      expect(info.allowed_transitions).toEqual(['confirmed', 'cancelled']);
    });
  });

  describe('Valid Sales Order Transitions', () => {
    it('draft -> confirmed (success)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDraftOrder);
      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(salesOrderRepository, 'listItems').mockResolvedValueOnce([mockItem]);
      const updateSpy = vi.spyOn(salesOrderRepository, 'update').mockResolvedValueOnce({
        ...mockDraftOrder,
        status: 'confirmed',
      });
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-sm-1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'SALES_ORDER',
        entity_id: orderId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const updated = await salesOrderStateMachineService.confirmSalesOrder(orgAId, orderId, userAId);

      expect(updated.status).toBe('confirmed');
      expect(updateSpy).toHaveBeenCalledWith(orgAId, orderId, { status: 'confirmed' }, mockClient);
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entity_type: 'SALES_ORDER',
          metadata: expect.objectContaining({
            event: 'SALES_ORDER_STATUS_TRANSITION',
            from_status: 'draft',
            to_status: 'confirmed',
          }),
        }),
        mockClient,
      );
    });

    it('confirmed -> processing (success)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const confirmedOrder = { ...mockDraftOrder, status: 'confirmed' as const };
      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(confirmedOrder);
      vi.spyOn(salesOrderRepository, 'update').mockResolvedValueOnce({
        ...confirmedOrder,
        status: 'processing',
      });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-sm-2',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'SALES_ORDER',
        entity_id: orderId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const updated = await salesOrderStateMachineService.processSalesOrder(orgAId, orderId, userAId);
      expect(updated.status).toBe('processing');
    });

    it('processing -> shipped -> completed (success lifecycle)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      // processing -> shipped
      const processingOrder = { ...mockDraftOrder, status: 'processing' as const };
      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(processingOrder);
      vi.spyOn(salesOrderRepository, 'update').mockResolvedValueOnce({
        ...processingOrder,
        status: 'shipped',
      });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-sm-3',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'SALES_ORDER',
        entity_id: orderId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const shipped = await salesOrderStateMachineService.shipSalesOrder(orgAId, orderId);
      expect(shipped.status).toBe('shipped');

      // shipped -> completed
      const shippedOrder = { ...mockDraftOrder, status: 'shipped' as const };
      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(shippedOrder);
      vi.spyOn(salesOrderRepository, 'update').mockResolvedValueOnce({
        ...shippedOrder,
        status: 'completed',
      });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-sm-4',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'SALES_ORDER',
        entity_id: orderId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const completed = await salesOrderStateMachineService.completeSalesOrder(orgAId, orderId);
      expect(completed.status).toBe('completed');
    });

    it('draft -> cancelled (success)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDraftOrder);
      vi.spyOn(salesOrderRepository, 'update').mockResolvedValueOnce({
        ...mockDraftOrder,
        status: 'cancelled',
      });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-sm-5',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'SALES_ORDER',
        entity_id: orderId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const cancelled = await salesOrderStateMachineService.cancelSalesOrder(orgAId, orderId);
      expect(cancelled.status).toBe('cancelled');
    });
  });

  describe('Invalid Transitions & Terminal State Protections', () => {
    it('should reject invalid state jump (draft -> shipped)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDraftOrder);

      await expect(
        salesOrderStateMachineService.shipSalesOrder(orgAId, orderId),
      ).rejects.toThrow(InvalidSalesOrderStateTransitionError);
    });

    it('should reject any transition from terminal states (completed or cancelled)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const completedOrder = { ...mockDraftOrder, status: 'completed' as const };
      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(completedOrder);

      await expect(
        salesOrderStateMachineService.cancelSalesOrder(orgAId, orderId),
      ).rejects.toThrow(InvalidSalesOrderStateTransitionError);

      const cancelledOrder = { ...mockDraftOrder, status: 'cancelled' as const };
      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(cancelledOrder);

      await expect(
        salesOrderStateMachineService.confirmSalesOrder(orgAId, orderId),
      ).rejects.toThrow(InvalidSalesOrderStateTransitionError);
    });

    it('should reject transition if sales order has no line items when confirming', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDraftOrder);
      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(salesOrderRepository, 'listItems').mockResolvedValueOnce([]); // Empty line items!

      await expect(
        salesOrderStateMachineService.confirmSalesOrder(orgAId, orderId),
      ).rejects.toThrow(SalesOrderMissingItemsError);
    });

    it('should reject duplicate transition attempt to same state (idempotency error)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const confirmedOrder = { ...mockDraftOrder, status: 'confirmed' as const };
      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(confirmedOrder);

      await expect(
        salesOrderStateMachineService.confirmSalesOrder(orgAId, orderId),
      ).rejects.toThrow(SalesOrderAlreadyInStateError);
    });
  });

  describe('Security, Tenant Isolation & Direct Status Bypass Protection', () => {
    it('should enforce tenant isolation (Org B user denied transition on Org A order)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(null);

      await expect(
        salesOrderStateMachineService.confirmSalesOrder(orgBId, orderId),
      ).rejects.toThrow(SalesOrderNotFoundError);
    });

    it('should prevent direct status bypass via SalesOrderService.updateSalesOrder', async () => {
      await expect(
        salesOrderService.updateSalesOrder(orgAId, orderId, {
          status: 'shipped',
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Concurrency Row-Locking & Audit Rollback', () => {
    it('should roll back status transition if audit log insertion fails', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const confirmedOrder = { ...mockDraftOrder, status: 'confirmed' as const };
      vi.spyOn(salesOrderRepository, 'lockByIdForUpdate').mockResolvedValueOnce(confirmedOrder);
      vi.spyOn(salesOrderRepository, 'update').mockResolvedValueOnce({
        ...confirmedOrder,
        status: 'processing',
      });

      // Force audit failure
      vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(new Error('Audit DB Failure'));

      await expect(
        salesOrderStateMachineService.processSalesOrder(orgAId, orderId),
      ).rejects.toThrow('Audit DB Failure');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
