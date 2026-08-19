import { describe, it, expect, vi } from 'vitest';
import { salesOrderRepository } from '../src/repositories/salesOrder.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { handleDatabaseError, DuplicateKeyError, ForeignKeyViolationError, CheckConstraintViolationError } from '../src/db/errors';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('Sales Order Repository Subsystem (Phase 014)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const orderId = 'so-1111';
  const orderItemId = 'so-item-2222';
  const customerId = 'cust-1111';
  const productId = 'prod-1111';

  const mockSalesOrder = {
    id: orderId,
    organization_id: orgAId,
    customer_id: customerId,
    order_number: 'SO-2026-0001',
    order_date: new Date(),
    status: 'draft' as const,
    currency: 'USD',
    subtotal: '20499.8975',
    tax_amount: '3419.9816',
    discount_amount: '1000.0000',
    total_amount: '22919.8791',
    notes: 'Urgent enterprise order',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockSalesOrderItem = {
    id: orderItemId,
    organization_id: orgAId,
    sales_order_id: orderId,
    product_id: productId,
    quantity: '10.2500',
    unit_price: '1999.9900',
    discount_amount: '100.0000',
    tax_rate: '18.000000',
    tax_amount: '341.9982',
    line_total: '2241.9882',
    sequence: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO sales_orders')) {
      const orderNum = params?.[2] as string;
      const custId = params?.[1] as string;
      if (orderNum === 'SO-DUPLICATE') {
        throw handleDatabaseError({
          code: '23505',
          detail: 'Key (organization_id, order_number)=(11111111-1111-1111-1111-111111111111, SO-DUPLICATE) already exists.',
          constraint: 'uq_sales_orders_org_number',
        });
      }
      if (custId === 'INVALID-CUST') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (customer_id)=(INVALID-CUST) is not present in table "customers".',
          constraint: 'sales_orders_customer_id_fkey',
        });
      }
      return { rows: [mockSalesOrder], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('INSERT INTO sales_order_items')) {
      const qty = params?.[3] as string;
      const prodId = params?.[2] as string;
      if (qty.startsWith('-')) {
        throw handleDatabaseError({
          code: '23514',
          detail: 'Failing row contains negative quantity',
          constraint: 'sales_order_items_quantity_check',
        });
      }
      if (prodId === 'INVALID-PROD') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (product_id)=(INVALID-PROD) is not present in table "products".',
          constraint: 'sales_order_items_product_id_fkey',
        });
      }
      return { rows: [mockSalesOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM sales_order_items')) {
      const [id, orgId] = params as [string, string];
      if (id === orderItemId && orgId === orgAId) {
        return { rows: [{ id: orderItemId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM sales_orders')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [{ id: orderId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM sales_orders WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [mockSalesOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM sales_orders WHERE order_number = $1 AND organization_id = $2')) {
      const [num, orgId] = params as [string, string];
      if (num === 'SO-2026-0001' && orgId === orgAId) {
        return { rows: [mockSalesOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM sales_orders WHERE customer_id = $1 AND organization_id = $2')) {
      const [cId, orgId] = params as [string, string];
      if (cId === customerId && orgId === orgAId) {
        return { rows: [mockSalesOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM sales_order_items WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === orderItemId && orgId === orgAId) {
        return { rows: [mockSalesOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM sales_order_items WHERE sales_order_id = $1 AND organization_id = $2')) {
      const [soId, orgId] = params as [string, string];
      if (soId === orderId && orgId === orgAId) {
        return { rows: [mockSalesOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT 1 FROM sales_orders')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [{ '?column?': 1 }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('COUNT(*) as count FROM sales_orders')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE sales_orders SET')) {
      return { rows: [mockSalesOrder], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE sales_order_items SET')) {
      return { rows: [mockSalesOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM sales_orders')) {
      return { rows: [mockSalesOrder], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  };

  const createMockClient = () => {
    const mockClientQuery = vi.fn().mockImplementation(mockQueryFn);
    return {
      query: mockClientQuery,
      release: vi.fn(),
    } as unknown as PoolClient;
  };

  describe('SalesOrder Header CRUD Operations', () => {
    it('should create sales order preserving exact NUMERIC financial values', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const created = await salesOrderRepository.create({
        organization_id: orgAId,
        customer_id: customerId,
        order_number: 'SO-2026-0001',
        total_amount: '22919.8791',
        subtotal: '20499.8975',
        tax_amount: '3419.9816',
        discount_amount: '1000.0000',
      });

      expect(created.id).toBe(orderId);
      expect(created.total_amount).toBe('22919.8791');
      expect(typeof created.total_amount).toBe('string');
      expect(created.subtotal).toBe('20499.8975');
      expect(typeof created.subtotal).toBe('string');
    });

    it('should find sales order by ID, order number, and customer ID with tenant isolation', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const byId = await salesOrderRepository.findById(orgAId, orderId);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(orderId);

      const byNum = await salesOrderRepository.findByOrderNumber(orgAId, 'SO-2026-0001');
      expect(byNum).not.toBeNull();

      const byCust = await salesOrderRepository.findByCustomerId(orgAId, customerId);
      expect(byCust.length).toBe(1);
    });

    it('should update sales order status and totals', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await salesOrderRepository.update(orgAId, orderId, { status: 'confirmed' });
      expect(updated).not.toBeNull();
    });

    it('should delete sales order returning boolean status', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await salesOrderRepository.delete(orgAId, orderId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await salesOrderRepository.delete(orgBId, orderId);
      expect(crossTenantDelete).toBe(false);
    });

    it('should check sales order existence via SELECT 1', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const existsOrgA = await salesOrderRepository.exists(orgAId, orderId);
      expect(existsOrgA).toBe(true);

      const existsOrgB = await salesOrderRepository.exists(orgBId, orderId);
      expect(existsOrgB).toBe(false);
    });
  });

  describe('SalesOrder Line Item Operations', () => {
    it('should create sales order item preserving exact NUMERIC values', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const item = await salesOrderRepository.createItem({
        organization_id: orgAId,
        sales_order_id: orderId,
        product_id: productId,
        quantity: '10.2500',
        unit_price: '1999.9900',
        discount_amount: '100.0000',
        tax_rate: '18.000000',
        tax_amount: '341.9982',
        line_total: '2241.9882',
        sequence: 1,
      });

      expect(item.id).toBe(orderItemId);
      expect(item.quantity).toBe('10.2500');
      expect(typeof item.quantity).toBe('string');
      expect(item.unit_price).toBe('1999.9900');
      expect(typeof item.unit_price).toBe('string');
      expect(item.line_total).toBe('2241.9882');
    });

    it('should list items for a sales order', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const items = await salesOrderRepository.listItems(orgAId, orderId);
      expect(items.length).toBe(1);
      expect(items[0]!.id).toBe(orderItemId);
    });

    it('should update line item details', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await salesOrderRepository.updateItem(orgAId, orderItemId, { quantity: '20.0000' });
      expect(updated).not.toBeNull();
    });

    it('should delete line item returning boolean status', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await salesOrderRepository.deleteItem(orgAId, orderItemId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await salesOrderRepository.deleteItem(orgBId, orderItemId);
      expect(crossTenantDelete).toBe(false);
    });
  });

  describe('Multi-Tenant Cross-Tenant Isolation Test', () => {
    it('should deny cross-tenant access for order header and items when using Org B', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const crossOrder = await salesOrderRepository.findById(orgBId, orderId);
      expect(crossOrder).toBeNull();

      const crossOrderNum = await salesOrderRepository.findByOrderNumber(orgBId, 'SO-2026-0001');
      expect(crossOrderNum).toBeNull();

      const crossItems = await salesOrderRepository.listItems(orgBId, orderId);
      expect(crossItems.length).toBe(0);
    });
  });

  describe('Database Constraint Normalization', () => {
    it('should map duplicate order_number within organization to DuplicateKeyError (23505)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        salesOrderRepository.create({
          organization_id: orgAId,
          customer_id: customerId,
          order_number: 'SO-DUPLICATE',
        }),
      ).rejects.toThrow(DuplicateKeyError);
    });

    it('should map invalid customer or product FK to ForeignKeyViolationError (23503)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        salesOrderRepository.create({
          organization_id: orgAId,
          customer_id: 'INVALID-CUST',
          order_number: 'SO-INVALID-CUST',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);

      await expect(
        salesOrderRepository.createItem({
          organization_id: orgAId,
          sales_order_id: orderId,
          product_id: 'INVALID-PROD',
          quantity: '1.0000',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);
    });

    it('should map negative quantity or price to CheckConstraintViolationError (23514)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        salesOrderRepository.createItem({
          organization_id: orgAId,
          sales_order_id: orderId,
          product_id: productId,
          quantity: '-5.0000',
        }),
      ).rejects.toThrow(CheckConstraintViolationError);
    });
  });

  describe('Transaction Client Propagation & Security', () => {
    it('should propagate supplied PoolClient inside withTransaction for atomic sales order creation', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        const header = await salesOrderRepository.create(
          {
            organization_id: orgAId,
            customer_id: customerId,
            order_number: 'SO-TX-001',
          },
          txClient,
        );

        await salesOrderRepository.createItem(
          {
            organization_id: orgAId,
            sales_order_id: header.id,
            product_id: productId,
            quantity: '1.0000',
          },
          txClient,
        );
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject malicious sort parameter input via sort allowlist', () => {
      expect(() => sanitizeSortColumn('created_at; DROP TABLE users', ['order_number', 'total_amount'])).toThrow(
        ValidationError,
      );
    });
  });
});
