import { describe, it, expect, vi } from 'vitest';
import { salesDeliveryService } from '../src/services/salesDelivery.service';
import { salesDeliveryRepository } from '../src/repositories/salesDelivery.repository';
import { salesOrderRepository } from '../src/repositories/salesOrder.repository';
import { warehouseRepository } from '../src/repositories/warehouse.repository';
import { productRepository } from '../src/repositories/product.repository';
import { inventoryService } from '../src/services/inventory.service';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { OverDeliveryError, ValidationError } from '../src/types';
import { Inventory } from '../src/types/database';
import { PoolClient } from 'pg';

describe('Sales Delivery Service Subsystem (Phase 027)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const custId = '44444444-4444-4444-4444-444444444444';
  const prodId = '55555555-5555-5555-5555-555555555555';
  const whId = '66666666-6666-6666-6666-666666666666';
  const orderId = '77777777-7777-7777-7777-777777777777';
  const soItemId = '88888888-8888-8888-8888-888888888888';
  const deliveryId = '99999999-9999-9999-9999-999999999999';

  const mockSalesOrder = {
    id: orderId,
    organization_id: orgAId,
    customer_id: custId,
    order_number: 'SO-10001',
    order_date: new Date(),
    status: 'confirmed' as const,
    currency: 'USD',
    subtotal: '100.0000',
    tax_amount: '0.0000',
    discount_amount: '0.0000',
    total_amount: '100.0000',
    notes: null,
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

  const mockSOItem = {
    id: soItemId,
    organization_id: orgAId,
    sales_order_id: orderId,
    product_id: prodId,
    quantity: '10.0000',
    unit_price: '10.0000',
    discount_amount: '0.0000',
    tax_rate: '0.000000',
    tax_amount: '0.0000',
    line_total: '100.0000',
    sequence: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

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
    created_by: userAId,
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

  describe('Create Sales Delivery', () => {
    it('should create a sales delivery header for a confirmed sales order', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesOrderRepository, 'findById').mockResolvedValueOnce(mockSalesOrder);
      vi.spyOn(warehouseRepository, 'findById').mockResolvedValueOnce(mockWarehouse);
      vi.spyOn(salesDeliveryRepository, 'getDeliveryByNumber').mockResolvedValueOnce(null);
      vi.spyOn(salesDeliveryRepository, 'createDelivery').mockResolvedValueOnce(mockDelivery);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-del-c1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'SALES_DELIVERY',
        entity_id: deliveryId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const created = await salesDeliveryService.createDelivery(
        {
          organization_id: orgAId,
          sales_order_id: orderId,
          warehouse_id: whId,
        },
        userAId,
      );

      expect(created.id).toBe(deliveryId);
      expect(created.delivery_number).toBe('DEL-100001');
      expect(auditSpy).toHaveBeenCalled();
    });

    it('should reject delivery creation if sales order is in draft or cancelled status', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesOrderRepository, 'findById').mockResolvedValueOnce({
        ...mockSalesOrder,
        status: 'draft',
      });

      await expect(
        salesDeliveryService.createDelivery({
          organization_id: orgAId,
          sales_order_id: orderId,
          warehouse_id: whId,
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Delivery Items & Over-Delivery Protection', () => {
    it('should add delivery item when requested quantity is within remaining deliverable quantity', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDelivery);
      vi.spyOn(salesOrderRepository, 'findItemById').mockResolvedValueOnce(mockSOItem);
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(salesDeliveryRepository, 'getDeliveredQuantityForSalesOrderItem').mockResolvedValueOnce(
        '4.0000',
      );

      const mockDeliveryItem = {
        id: 'del-item-1',
        organization_id: orgAId,
        delivery_id: deliveryId,
        sales_order_item_id: soItemId,
        product_id: prodId,
        quantity: '5.0000',
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.spyOn(salesDeliveryRepository, 'createDeliveryItem').mockResolvedValueOnce(mockDeliveryItem);
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-del-i1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'SALES_DELIVERY',
        entity_id: deliveryId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const item = await salesDeliveryService.addDeliveryItem(
        orgAId,
        deliveryId,
        {
          sales_order_item_id: soItemId,
          product_id: prodId,
          quantity: '5.0000',
        },
        userAId,
      );

      expect(item.quantity).toBe('5.0000');
    });

    it('should reject delivery item addition when requested quantity exceeds remaining deliverable quantity (over-delivery)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValueOnce(mockDelivery);
      vi.spyOn(salesOrderRepository, 'findItemById').mockResolvedValueOnce(mockSOItem); // ordered: 10.0000
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(salesDeliveryRepository, 'getDeliveredQuantityForSalesOrderItem').mockResolvedValueOnce(
        '7.0000', // already delivered: 7 -> remaining: 3
      );

      await expect(
        salesDeliveryService.addDeliveryItem(
          orgAId,
          deliveryId,
          {
            sales_order_item_id: soItemId,
            product_id: prodId,
            quantity: '4.0000', // 4 > 3 -> OverDeliveryError!
          },
          userAId,
        ),
      ).rejects.toThrow(OverDeliveryError);
    });
  });

  describe('Shipment Workflow & Inventory Engine Integration', () => {
    it('should decrease stock, create stock ledger entries, and update status to shipped when shipping', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValue(mockClient);

      const packedDelivery = { ...mockDelivery, status: 'packed' as const };
      vi.spyOn(salesDeliveryRepository, 'lockByIdForUpdate').mockResolvedValue(packedDelivery);

      const mockDeliveryItem = {
        id: 'del-item-1',
        organization_id: orgAId,
        delivery_id: deliveryId,
        sales_order_item_id: soItemId,
        product_id: prodId,
        quantity: '5.0000',
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.spyOn(salesDeliveryRepository, 'getDeliveryItems').mockResolvedValueOnce([mockDeliveryItem]);

      const decreaseStockSpy = vi
        .spyOn(inventoryService, 'decreaseStock')
        .mockResolvedValueOnce({ id: 'inv-1' } as Inventory);
      vi.spyOn(salesDeliveryRepository, 'updateDelivery').mockResolvedValueOnce({
        ...packedDelivery,
        status: 'shipped',
        shipped_at: new Date(),
      });
      vi.spyOn(salesOrderRepository, 'listItems').mockResolvedValueOnce([mockSOItem]);
      vi.spyOn(salesDeliveryRepository, 'getDeliveredQuantityForSalesOrderItem').mockResolvedValueOnce(
        '5.0000',
      );
      vi.spyOn(salesOrderRepository, 'findById').mockResolvedValueOnce(mockSalesOrder);
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValue({
        id: 'aud-ship',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'SALES_DELIVERY',
        entity_id: deliveryId,
        request_id: undefined,
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const shipped = await salesDeliveryService.shipDelivery(orgAId, deliveryId, userAId);

      expect(shipped.status).toBe('shipped');
      expect(decreaseStockSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: orgAId,
          product_id: prodId,
          warehouse_id: whId,
          quantity: '5.0000',
          reference_type: 'SALES_DELIVERY',
          reference_id: deliveryId,
        }),
        userAId,
        undefined,
      );
    });
  });
});
