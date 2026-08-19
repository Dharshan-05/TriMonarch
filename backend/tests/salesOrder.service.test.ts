import { describe, it, expect, vi } from 'vitest';
import { salesOrderService } from '../src/services/salesOrder.service';
import { salesOrderRepository } from '../src/repositories/salesOrder.repository';
import { customerRepository } from '../src/repositories/customer.repository';
import { productRepository } from '../src/repositories/product.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import {
  CustomerNotFoundError,
  ProductNotFoundError,
  SalesOrderNotFoundError,
  SalesOrderItemNotFoundError,
  DuplicateOrderNumberError,
  ValidationError,
} from '../src/types';
import { PoolClient } from 'pg';

describe('Sales Order Service Subsystem (Phase 025)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const custId = '44444444-4444-4444-4444-444444444444';
  const prod1Id = '55555555-5555-5555-5555-555555555555';
  const prod2Id = '66666666-6666-6666-6666-666666666666';
  const orderId = '77777777-7777-7777-7777-777777777777';
  const itemId = '88888888-8888-8888-8888-888888888888';

  const mockCustomer = {
    id: custId,
    organization_id: orgAId,
    name: 'Acme Sales Customer',
    email: 'sales@acme.com',
    phone: null,
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProduct1 = {
    id: prod1Id,
    organization_id: orgAId,
    sku: 'PROD-SO-1',
    name: 'Widget Alpha',
    description: null,
    category: null,
    unit: 'pcs',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockProduct2 = {
    id: prod2Id,
    organization_id: orgAId,
    sku: 'PROD-SO-2',
    name: 'Widget Beta',
    description: null,
    category: null,
    unit: 'pcs',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockOrder = {
    id: orderId,
    organization_id: orgAId,
    customer_id: custId,
    order_number: 'SO-10001',
    order_date: new Date(),
    status: 'draft' as const,
    currency: 'USD',
    subtotal: '0.0000',
    tax_amount: '0.0000',
    discount_amount: '0.0000',
    total_amount: '0.0000',
    notes: 'Test order notes',
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

  describe('Financial Calculation Engine & Decimal Precision', () => {
    it('should calculate exact line item totals using exact decimal arithmetic', () => {
      // quantity = "3.1250", unit_price = "10.2500", discount = "1.0000", tax_rate = "10.000000"
      // gross_line = 3.1250 * 10.2500 = 32.03125 -> 32.0313
      // discounted_line = 32.0313 - 1.0000 = 31.0313
      // tax_amount = 31.0313 * 0.10 = 3.10313 -> 3.1031
      // line_total = 31.0313 + 3.1031 = 34.1344
      const res = salesOrderService.calculateItemTotals('3.1250', '10.2500', '1.0000', '10.000000');

      expect(res.quantity).toBe('3.1250');
      expect(res.unit_price).toBe('10.2500');
      expect(res.discount_amount).toBe('1.0000');
      expect(res.tax_rate).toBe('10.000000');
      expect(res.discounted_line).toBe('31.0313');
      expect(res.tax_amount).toBe('3.1031');
      expect(res.line_total).toBe('34.1344');
    });

    it('should calculate exact order totals across multiple line items', () => {
      // Item 1: quantity = 2.0000, unit_price = 10.5000, discount = 0.0000, tax_rate = 10.000000
      // gross = 21.0000, discounted = 21.0000, tax = 2.1000, total = 23.1000
      // Item 2: quantity = 3.0000, unit_price = 5.2500, discount = 1.0000, tax_rate = 0.000000
      // gross = 15.7500, discounted = 14.7500, tax = 0.0000, total = 14.7500
      // Expected Order Totals:
      // subtotal = 21.0000 + 14.7500 = 35.7500
      // discount_amount = 0.0000 + 1.0000 = 1.0000
      // tax_amount = 2.1000 + 0.0000 = 2.1000
      // total_amount = 35.7500 + 2.1000 = 37.8500
      const items = [
        {
          id: 'item-1',
          organization_id: orgAId,
          sales_order_id: orderId,
          product_id: prod1Id,
          quantity: '2.0000',
          unit_price: '10.5000',
          discount_amount: '0.0000',
          tax_rate: '10.000000',
          tax_amount: '2.1000',
          line_total: '23.1000',
          sequence: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 'item-2',
          organization_id: orgAId,
          sales_order_id: orderId,
          product_id: prod2Id,
          quantity: '3.0000',
          unit_price: '5.2500',
          discount_amount: '1.0000',
          tax_rate: '0.000000',
          tax_amount: '0.0000',
          line_total: '14.7500',
          sequence: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      const totals = salesOrderService.calculateOrderTotals(items);

      expect(totals.subtotal).toBe('35.7500');
      expect(totals.discount_amount).toBe('1.0000');
      expect(totals.tax_amount).toBe('2.1000');
      expect(totals.total_amount).toBe('37.8500');
    });
  });

  describe('Create Sales Order & Create With Line Items Workflows', () => {
    it('should create a sales order header with Category A audit logging', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(salesOrderRepository, 'findByOrderNumber').mockResolvedValueOnce(null);
      vi.spyOn(salesOrderRepository, 'create').mockResolvedValueOnce(mockOrder);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-so-1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'SALES_ORDER',
        entity_id: orderId,
        request_id: 'req-so-1',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await salesOrderService.createSalesOrder(
        {
          organization_id: orgAId,
          customer_id: custId,
          order_number: 'SO-10001',
          notes: 'Test order notes',
        },
        userAId,
        'req-so-1',
      );

      expect(res.id).toBe(orderId);
      expect(res.order_number).toBe('SO-10001');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entity_type: 'SALES_ORDER',
        }),
        mockClient,
      );
    });

    it('should transactionally create sales order with line items and exact header totals', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(salesOrderRepository, 'findByOrderNumber').mockResolvedValueOnce(null);
      vi.spyOn(productRepository, 'findById')
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);

      const createdOrderHeader = {
        ...mockOrder,
        subtotal: '35.7500',
        tax_amount: '2.1000',
        discount_amount: '1.0000',
        total_amount: '37.8500',
      };
      vi.spyOn(salesOrderRepository, 'create').mockResolvedValueOnce(createdOrderHeader);

      const mockItem1 = {
        id: 'item-1',
        organization_id: orgAId,
        sales_order_id: orderId,
        product_id: prod1Id,
        quantity: '2.0000',
        unit_price: '10.5000',
        discount_amount: '0.0000',
        tax_rate: '10.000000',
        tax_amount: '2.1000',
        line_total: '23.1000',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockItem2 = {
        id: 'item-2',
        organization_id: orgAId,
        sales_order_id: orderId,
        product_id: prod2Id,
        quantity: '3.0000',
        unit_price: '5.2500',
        discount_amount: '1.0000',
        tax_rate: '0.000000',
        tax_amount: '0.0000',
        line_total: '14.7500',
        sequence: 2,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(salesOrderRepository, 'createItem')
        .mockResolvedValueOnce(mockItem1)
        .mockResolvedValueOnce(mockItem2);

      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-so-items',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'SALES_ORDER',
        entity_id: orderId,
        request_id: 'req-so-items',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const result = await salesOrderService.createSalesOrderWithItems(
        {
          organization_id: orgAId,
          customer_id: custId,
          order_number: 'SO-10001',
          items: [
            {
              product_id: prod1Id,
              quantity: '2.0000',
              unit_price: '10.5000',
              tax_rate: '10.000000',
            },
            {
              product_id: prod2Id,
              quantity: '3.0000',
              unit_price: '5.2500',
              discount_amount: '1.0000',
            },
          ],
        },
        userAId,
        'req-so-items',
      );

      expect(result.order.total_amount).toBe('37.8500');
      expect(result.items.length).toBe(2);
      expect(result.items[0]!.line_total).toBe('23.1000');
      expect(result.items[1]!.line_total).toBe('14.7500');
    });
  });

  describe('Tenant Isolation & Boundary Validation', () => {
    it('should reject customer belonging to another organization', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(null);

      await expect(
        salesOrderService.createSalesOrder(
          {
            organization_id: orgBId,
            customer_id: custId,
            order_number: 'SO-99999',
          },
          userAId,
        ),
      ).rejects.toThrow(CustomerNotFoundError);
    });

    it('should reject product belonging to another organization during item creation', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(salesOrderRepository, 'findByOrderNumber').mockResolvedValueOnce(null);
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(null); // Product not found in Org A

      await expect(
        salesOrderService.createSalesOrderWithItems(
          {
            organization_id: orgAId,
            customer_id: custId,
            order_number: 'SO-10002',
            items: [
              {
                product_id: '99999999-9999-9999-9999-999999999999',
                quantity: '1.0000',
                unit_price: '10.0000',
              },
            ],
          },
          userAId,
        ),
      ).rejects.toThrow(ProductNotFoundError);
    });

    it('should reject duplicate order number within organization', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(salesOrderRepository, 'findByOrderNumber').mockResolvedValueOnce(mockOrder); // Already exists!

      await expect(
        salesOrderService.createSalesOrder(
          {
            organization_id: orgAId,
            customer_id: custId,
            order_number: 'SO-10001',
          },
          userAId,
        ),
      ).rejects.toThrow(DuplicateOrderNumberError);
    });

    it('should throw SalesOrderNotFoundError when sales order does not exist', async () => {
      vi.spyOn(salesOrderRepository, 'findById').mockResolvedValueOnce(null);
      await expect(
        salesOrderService.getSalesOrderById(orgAId, '99999999-9999-9999-9999-999999999999'),
      ).rejects.toThrow(SalesOrderNotFoundError);
    });

    it('should throw SalesOrderItemNotFoundError when line item does not exist', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);
      vi.spyOn(salesOrderRepository, 'findItemById').mockResolvedValueOnce(null);

      await expect(
        salesOrderService.updateSalesOrderItem(orgAId, '99999999-9999-9999-9999-999999999999', {
          quantity: '10.0000',
        }),
      ).rejects.toThrow(SalesOrderItemNotFoundError);
    });

    it('should reject invalid quantity (e.g. quantity <= 0)', async () => {
      await expect(
        salesOrderService.createSalesOrderWithItems({
          organization_id: orgAId,
          customer_id: custId,
          order_number: 'SO-BAD-QTY',
          items: [
            {
              product_id: prod1Id,
              quantity: '0.0000',
              unit_price: '10.0000',
            },
          ],
        }),
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('Line Item CRUD & Order Total Recalculation', () => {
    it('should add line item and automatically recalculate parent order totals', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(salesOrderRepository, 'findById').mockResolvedValue(mockOrder);
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct1);

      const newItem = {
        id: itemId,
        organization_id: orgAId,
        sales_order_id: orderId,
        product_id: prod1Id,
        quantity: '5.0000',
        unit_price: '20.0000',
        discount_amount: '0.0000',
        tax_rate: '0.000000',
        tax_amount: '0.0000',
        line_total: '100.0000',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(salesOrderRepository, 'createItem').mockResolvedValueOnce(newItem);
      vi.spyOn(salesOrderRepository, 'listItems').mockResolvedValueOnce([newItem]);
      const updateHeaderSpy = vi.spyOn(salesOrderRepository, 'update').mockResolvedValueOnce({
        ...mockOrder,
        subtotal: '100.0000',
        total_amount: '100.0000',
      });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-add-item',
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

      const added = await salesOrderService.addSalesOrderItem(orgAId, orderId, {
        product_id: prod1Id,
        quantity: '5.0000',
        unit_price: '20.0000',
      });

      expect(added.line_total).toBe('100.0000');
      expect(updateHeaderSpy).toHaveBeenCalledWith(
        orgAId,
        orderId,
        expect.objectContaining({
          subtotal: '100.0000',
          total_amount: '100.0000',
        }),
        mockClient,
      );
    });

    it('should delete line item and recalculate parent order totals', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const itemToDelete = {
        id: itemId,
        organization_id: orgAId,
        sales_order_id: orderId,
        product_id: prod1Id,
        quantity: '5.0000',
        unit_price: '20.0000',
        discount_amount: '0.0000',
        tax_rate: '0.000000',
        tax_amount: '0.0000',
        line_total: '100.0000',
        sequence: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(salesOrderRepository, 'findItemById').mockResolvedValueOnce(itemToDelete);
      vi.spyOn(salesOrderRepository, 'findById').mockResolvedValueOnce(mockOrder);
      vi.spyOn(salesOrderRepository, 'deleteItem').mockResolvedValueOnce(true);
      vi.spyOn(salesOrderRepository, 'listItems').mockResolvedValueOnce([]); // No items remaining
      const updateHeaderSpy = vi.spyOn(salesOrderRepository, 'update').mockResolvedValueOnce(mockOrder);
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'aud-del-item',
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

      const deleted = await salesOrderService.deleteSalesOrderItem(orgAId, itemId);

      expect(deleted).toBe(true);
      expect(updateHeaderSpy).toHaveBeenCalledWith(
        orgAId,
        orderId,
        expect.objectContaining({
          subtotal: '0.0000',
          total_amount: '0.0000',
        }),
        mockClient,
      );
    });
  });

  describe('Audit Failure Rollback Protection', () => {
    it('should roll back sales order creation if audit log insertion fails', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(customerRepository, 'findById').mockResolvedValueOnce(mockCustomer);
      vi.spyOn(salesOrderRepository, 'findByOrderNumber').mockResolvedValueOnce(null);
      vi.spyOn(salesOrderRepository, 'create').mockResolvedValueOnce(mockOrder);

      // Force audit insertion failure
      vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(new Error('Audit DB Insertion Failure'));

      await expect(
        salesOrderService.createSalesOrder(
          {
            organization_id: orgAId,
            customer_id: custId,
            order_number: 'SO-10001',
          },
          userAId,
        ),
      ).rejects.toThrow('Audit DB Insertion Failure');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
