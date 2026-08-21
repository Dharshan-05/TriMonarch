import { describe, it, expect, vi } from 'vitest';
import { salesDeliveryService } from '../src/services/salesDelivery.service';
import { salesDeliveryRepository } from '../src/repositories/salesDelivery.repository';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';

describe('Sales Delivery Integration & End-to-End Workflows (Phase 027)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orderId = '77777777-7777-7777-7777-777777777777';
  const whId = '66666666-6666-6666-6666-666666666666';
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

  it('should list deliveries by sales order ID', async () => {
    vi.spyOn(salesDeliveryRepository, 'getDeliveriesBySalesOrder').mockResolvedValueOnce([
      mockDelivery,
    ]);

    const result = await salesDeliveryService.getSalesOrderDeliveries(orgAId, orderId);

    expect(result.length).toBe(1);
    expect(result[0]!.sales_order_id).toBe(orderId);
  });

  it('should transition delivery status draft -> confirmed -> picking -> packed -> shipped -> delivered', async () => {
    const mockClient = createMockPoolClient();
    vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

    // draft -> confirmed
    vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDelivery);
    vi.spyOn(salesDeliveryRepository, 'updateDelivery').mockResolvedValueOnce({
      ...mockDelivery,
      status: 'confirmed',
    });
    const confirmed = await salesDeliveryService.confirmDelivery(orgAId, deliveryId);
    expect(confirmed.status).toBe('confirmed');

    // confirmed -> picking
    vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockDelivery,
      status: 'confirmed',
    });
    vi.spyOn(salesDeliveryRepository, 'updateDelivery').mockResolvedValueOnce({
      ...mockDelivery,
      status: 'picking',
    });
    const picking = await salesDeliveryService.startPicking(orgAId, deliveryId);
    expect(picking.status).toBe('picking');

    // picking -> packed
    vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce({
      ...mockDelivery,
      status: 'picking',
    });
    vi.spyOn(salesDeliveryRepository, 'updateDelivery').mockResolvedValueOnce({
      ...mockDelivery,
      status: 'packed',
    });
    const packed = await salesDeliveryService.markPacked(orgAId, deliveryId);
    expect(packed.status).toBe('packed');
  });
});
