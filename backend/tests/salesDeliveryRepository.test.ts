import { describe, it, expect, vi } from 'vitest';
import { salesDeliveryRepository } from '../src/repositories/salesDelivery.repository';
import { PoolClient } from 'pg';

describe('Sales Delivery Repository Subsystem (Phase 027)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const orderId = '77777777-7777-7777-7777-777777777777';
  const whId = '88888888-8888-8888-8888-888888888888';
  const deliveryId = '99999999-9999-9999-9999-999999999999';

  const mockDelivery = {
    id: deliveryId,
    organization_id: orgAId,
    sales_order_id: orderId,
    delivery_number: 'DEL-100001',
    warehouse_id: whId,
    status: 'draft' as const,
    delivery_date: new Date(),
    shipped_at: null,
    delivered_at: null,
    cancelled_at: null,
    notes: 'Test delivery notes',
    created_by: null,
    updated_by: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const createMockPoolClient = (overrideRows?: Record<string, unknown>[]) => {
    const mockQuery = vi.fn().mockImplementation(async (sql: string, params?: unknown[]) => {
      if (params && params.includes(orgBId)) {
        return { rows: [], rowCount: 0, command: sql, oid: 0, fields: [] };
      }
      return {
        rows: overrideRows !== undefined ? overrideRows : [mockDelivery],
        rowCount: (overrideRows !== undefined ? overrideRows : [mockDelivery]).length,
        command: sql,
        oid: 0,
        fields: [],
      };
    });
    const mockRelease = vi.fn();
    return {
      query: mockQuery,
      release: mockRelease,
    } as unknown as PoolClient;
  };

  it('should create a new delivery record with organization scoping', async () => {
    const mockClient = createMockPoolClient();

    const result = await salesDeliveryRepository.createDelivery(
      {
        organization_id: orgAId,
        sales_order_id: orderId,
        delivery_number: 'DEL-100001',
        warehouse_id: whId,
      },
      mockClient,
    );

    expect(result.id).toBe(deliveryId);
    expect(result.delivery_number).toBe('DEL-100001');
  });

  it('should retrieve delivery by ID and enforce organization isolation', async () => {
    const mockClient = createMockPoolClient();

    const foundOrgA = await salesDeliveryRepository.getDeliveryById(orgAId, deliveryId, mockClient);
    expect(foundOrgA).not.toBeNull();

    const foundOrgB = await salesDeliveryRepository.getDeliveryById(orgBId, deliveryId, mockClient);
    expect(foundOrgB).toBeNull();
  });

  it('should acquire FOR UPDATE row lock via lockByIdForUpdate', async () => {
    const mockClient = createMockPoolClient();

    const locked = await salesDeliveryRepository.lockByIdForUpdate(orgAId, deliveryId, mockClient);
    expect(locked).not.toBeNull();
    expect(mockClient.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      [deliveryId, orgAId],
    );
  });

  it('should sum delivered quantities for a sales order item excluding cancelled deliveries', async () => {
    const mockClient = createMockPoolClient([{ total_delivered: '15.5000' }]);

    const total = await salesDeliveryRepository.getDeliveredQuantityForSalesOrderItem(
      orgAId,
      'so-item-123',
      mockClient,
    );

    expect(total).toBe('15.5000');
  });
});
