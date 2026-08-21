import { describe, it, expect, vi } from 'vitest';
import { salesDeliveryStateMachineService } from '../src/services/salesDeliveryStateMachine.service';
import { salesDeliveryRepository } from '../src/repositories/salesDelivery.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  SalesDeliveryNotFoundError,
  InvalidSalesDeliveryStateTransitionError,
  SalesDeliveryAlreadyInStateError,
} from '../src/types';
import { PoolClient } from 'pg';

describe('Sales Delivery State Machine Subsystem (Phase 027)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const deliveryId = '99999999-9999-9999-9999-999999999999';

  const mockDelivery = {
    id: deliveryId,
    organization_id: orgAId,
    sales_order_id: 'so-100',
    delivery_number: 'DEL-100001',
    warehouse_id: 'wh-100',
    status: 'draft' as const,
    delivery_date: new Date(),
    shipped_at: null,
    delivered_at: null,
    cancelled_at: null,
    notes: null,
    created_by: null,
    updated_by: null,
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
      expect(salesDeliveryStateMachineService.canTransition('draft', 'confirmed')).toBe(true);
      expect(salesDeliveryStateMachineService.canTransition('confirmed', 'picking')).toBe(true);
      expect(salesDeliveryStateMachineService.canTransition('picking', 'packed')).toBe(true);
      expect(salesDeliveryStateMachineService.canTransition('packed', 'shipped')).toBe(true);
      expect(salesDeliveryStateMachineService.canTransition('shipped', 'delivered')).toBe(true);

      // Cancellation paths
      expect(salesDeliveryStateMachineService.canTransition('draft', 'cancelled')).toBe(true);
      expect(salesDeliveryStateMachineService.canTransition('confirmed', 'cancelled')).toBe(true);
      expect(salesDeliveryStateMachineService.canTransition('picking', 'cancelled')).toBe(true);
      expect(salesDeliveryStateMachineService.canTransition('packed', 'cancelled')).toBe(true);

      // Invalid transitions
      expect(salesDeliveryStateMachineService.canTransition('draft', 'shipped')).toBe(false);
      expect(salesDeliveryStateMachineService.canTransition('shipped', 'cancelled')).toBe(false);
      expect(salesDeliveryStateMachineService.canTransition('delivered', 'draft')).toBe(false);
      expect(salesDeliveryStateMachineService.canTransition('cancelled', 'confirmed')).toBe(false);
    });

    it('should return available transitions for a Sales Delivery', async () => {
      vi.spyOn(salesDeliveryRepository, 'getDeliveryById').mockResolvedValueOnce(mockDelivery);

      const info = await salesDeliveryStateMachineService.getAvailableTransitions(orgAId, deliveryId);

      expect(info.current_status).toBe('draft');
      expect(info.allowed_transitions).toEqual(['confirmed', 'cancelled']);
    });
  });

  describe('Transactional Transitions & Concurrency', () => {
    it('should execute draft -> confirmed transition with audit logging inside withTransaction', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDelivery);
      const updateSpy = vi.spyOn(salesDeliveryRepository, 'updateDelivery').mockResolvedValueOnce({
        ...mockDelivery,
        status: 'confirmed',
      });
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-del-1',
        organization_id: orgAId,
        user_id: undefined,
        action: 'UPDATE',
        entity_type: 'SALES_DELIVERY',
        entity_id: deliveryId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const updated = await salesDeliveryStateMachineService.transitionDelivery(
        orgAId,
        deliveryId,
        'confirmed',
      );

      expect(updated.status).toBe('confirmed');
      expect(updateSpy).toHaveBeenCalledWith(
        orgAId,
        deliveryId,
        expect.objectContaining({ status: 'confirmed' }),
        mockClient,
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entity_type: 'SALES_DELIVERY',
        }),
        mockClient,
      );
    });

    it('should reject transition if delivery belongs to another organization (tenant isolation)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce(null);

      await expect(
        salesDeliveryStateMachineService.transitionDelivery(orgBId, deliveryId, 'confirmed'),
      ).rejects.toThrow(SalesDeliveryNotFoundError);
    });

    it('should throw SalesDeliveryAlreadyInStateError when requesting same status (idempotency)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
        ...mockDelivery,
        status: 'confirmed',
      });

      await expect(
        salesDeliveryStateMachineService.transitionDelivery(orgAId, deliveryId, 'confirmed'),
      ).rejects.toThrow(SalesDeliveryAlreadyInStateError);
    });

    it('should throw InvalidSalesDeliveryStateTransitionError when requesting invalid transition', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDelivery);

      await expect(
        salesDeliveryStateMachineService.transitionDelivery(orgAId, deliveryId, 'shipped'),
      ).rejects.toThrow(InvalidSalesDeliveryStateTransitionError);
    });
  });
});
