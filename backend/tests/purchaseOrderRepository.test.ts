import { describe, it, expect, vi } from 'vitest';
import { purchaseOrderRepository } from '../src/repositories/purchaseOrder.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { handleDatabaseError, DuplicateKeyError, ForeignKeyViolationError, CheckConstraintViolationError } from '../src/db/errors';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('Purchase Order Repository Subsystem (Phase 015)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const orderId = 'po-1111';
  const orderItemId = 'po-item-2222';
  const supplierId = 'supp-1111';
  const productId = 'prod-1111';

  const mockPurchaseOrder = {
    id: orderId,
    organization_id: orgAId,
    supplier_id: supplierId,
    order_number: 'PO-2026-0001',
    order_date: new Date(),
    expected_delivery_date: new Date(),
    status: 'draft' as const,
    currency: 'USD',
    subtotal: '50499.7475',
    tax_amount: '9089.9546',
    discount_amount: '2500.0000',
    total_amount: '57089.7021',
    notes: 'Bulk raw material purchase',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockPurchaseOrderItem = {
    id: orderItemId,
    organization_id: orgAId,
    purchase_order_id: orderId,
    product_id: productId,
    quantity: '25.2500',
    unit_cost: '1999.9900',
    discount_amount: '100.0000',
    tax_rate: '18.000000',
    tax_amount: '341.9982',
    line_total: '2241.9882',
    sequence: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO purchase_orders')) {
      const orderNum = params?.[2] as string;
      const suppId = params?.[1] as string;
      if (orderNum === 'PO-DUPLICATE') {
        throw handleDatabaseError({
          code: '23505',
          detail: 'Key (organization_id, order_number)=(11111111-1111-1111-1111-111111111111, PO-DUPLICATE) already exists.',
          constraint: 'uq_purchase_orders_org_number',
        });
      }
      if (suppId === 'INVALID-SUPP') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (supplier_id)=(INVALID-SUPP) is not present in table "suppliers".',
          constraint: 'purchase_orders_supplier_id_fkey',
        });
      }
      return { rows: [mockPurchaseOrder], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('INSERT INTO purchase_order_items')) {
      const qty = params?.[3] as string;
      const prodId = params?.[2] as string;
      if (qty.startsWith('-')) {
        throw handleDatabaseError({
          code: '23514',
          detail: 'Failing row contains negative quantity',
          constraint: 'purchase_order_items_quantity_check',
        });
      }
      if (prodId === 'INVALID-PROD') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (product_id)=(INVALID-PROD) is not present in table "products".',
          constraint: 'purchase_order_items_product_id_fkey',
        });
      }
      return { rows: [mockPurchaseOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM purchase_order_items')) {
      const [id, orgId] = params as [string, string];
      if (id === orderItemId && orgId === orgAId) {
        return { rows: [{ id: orderItemId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM purchase_orders')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [{ id: orderId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM purchase_orders WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [mockPurchaseOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM purchase_orders WHERE order_number = $1 AND organization_id = $2')) {
      const [num, orgId] = params as [string, string];
      if (num === 'PO-2026-0001' && orgId === orgAId) {
        return { rows: [mockPurchaseOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM purchase_orders WHERE supplier_id = $1 AND organization_id = $2')) {
      const [sId, orgId] = params as [string, string];
      if (sId === supplierId && orgId === orgAId) {
        return { rows: [mockPurchaseOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM purchase_order_items WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === orderItemId && orgId === orgAId) {
        return { rows: [mockPurchaseOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM purchase_order_items WHERE purchase_order_id = $1 AND organization_id = $2')) {
      const [poId, orgId] = params as [string, string];
      if (poId === orderId && orgId === orgAId) {
        return { rows: [mockPurchaseOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT 1 FROM purchase_orders')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [{ '?column?': 1 }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('COUNT(*) as count FROM purchase_orders')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE purchase_orders SET')) {
      return { rows: [mockPurchaseOrder], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE purchase_order_items SET')) {
      return { rows: [mockPurchaseOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM purchase_orders')) {
      return { rows: [mockPurchaseOrder], rowCount: 1, command: '', oid: 0, fields: [] };
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

  describe('PurchaseOrder Header CRUD Operations', () => {
    it('should create purchase order preserving exact NUMERIC financial values', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const created = await purchaseOrderRepository.create({
        organization_id: orgAId,
        supplier_id: supplierId,
        order_number: 'PO-2026-0001',
        total_amount: '57089.7021',
        subtotal: '50499.7475',
        tax_amount: '9089.9546',
        discount_amount: '2500.0000',
      });

      expect(created.id).toBe(orderId);
      expect(created.total_amount).toBe('57089.7021');
      expect(typeof created.total_amount).toBe('string');
      expect(created.subtotal).toBe('50499.7475');
      expect(typeof created.subtotal).toBe('string');
    });

    it('should find purchase order by ID, order number, and supplier ID with tenant isolation', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const byId = await purchaseOrderRepository.findById(orgAId, orderId);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(orderId);

      const byNum = await purchaseOrderRepository.findByOrderNumber(orgAId, 'PO-2026-0001');
      expect(byNum).not.toBeNull();

      const bySupp = await purchaseOrderRepository.findBySupplierId(orgAId, supplierId);
      expect(bySupp.length).toBe(1);
    });

    it('should update purchase order status and details', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await purchaseOrderRepository.update(orgAId, orderId, { status: 'submitted' });
      expect(updated).not.toBeNull();
    });

    it('should delete purchase order returning boolean status', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await purchaseOrderRepository.delete(orgAId, orderId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await purchaseOrderRepository.delete(orgBId, orderId);
      expect(crossTenantDelete).toBe(false);
    });

    it('should check purchase order existence via SELECT 1', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const existsOrgA = await purchaseOrderRepository.exists(orgAId, orderId);
      expect(existsOrgA).toBe(true);

      const existsOrgB = await purchaseOrderRepository.exists(orgBId, orderId);
      expect(existsOrgB).toBe(false);
    });
  });

  describe('PurchaseOrder Line Item Operations', () => {
    it('should create purchase order item preserving exact NUMERIC values', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const item = await purchaseOrderRepository.createItem({
        organization_id: orgAId,
        purchase_order_id: orderId,
        product_id: productId,
        quantity: '25.2500',
        unit_cost: '1999.9900',
        discount_amount: '100.0000',
        tax_rate: '18.000000',
        tax_amount: '341.9982',
        line_total: '2241.9882',
        sequence: 1,
      });

      expect(item.id).toBe(orderItemId);
      expect(item.quantity).toBe('25.2500');
      expect(typeof item.quantity).toBe('string');
      expect(item.unit_cost).toBe('1999.9900');
      expect(typeof item.unit_cost).toBe('string');
      expect(item.line_total).toBe('2241.9882');
    });

    it('should list items for a purchase order', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const items = await purchaseOrderRepository.listItems(orgAId, orderId);
      expect(items.length).toBe(1);
      expect(items[0]!.id).toBe(orderItemId);
    });

    it('should update line item details', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await purchaseOrderRepository.updateItem(orgAId, orderItemId, { quantity: '50.0000' });
      expect(updated).not.toBeNull();
    });

    it('should delete line item returning boolean status', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await purchaseOrderRepository.deleteItem(orgAId, orderItemId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await purchaseOrderRepository.deleteItem(orgBId, orderItemId);
      expect(crossTenantDelete).toBe(false);
    });
  });

  describe('Multi-Tenant Cross-Tenant Isolation Test', () => {
    it('should deny cross-tenant access for order header and items when using Org B', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const crossOrder = await purchaseOrderRepository.findById(orgBId, orderId);
      expect(crossOrder).toBeNull();

      const crossOrderNum = await purchaseOrderRepository.findByOrderNumber(orgBId, 'PO-2026-0001');
      expect(crossOrderNum).toBeNull();

      const crossItems = await purchaseOrderRepository.listItems(orgBId, orderId);
      expect(crossItems.length).toBe(0);
    });
  });

  describe('Database Constraint Normalization', () => {
    it('should map duplicate order_number within organization to DuplicateKeyError (23505)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        purchaseOrderRepository.create({
          organization_id: orgAId,
          supplier_id: supplierId,
          order_number: 'PO-DUPLICATE',
        }),
      ).rejects.toThrow(DuplicateKeyError);
    });

    it('should map invalid supplier or product FK to ForeignKeyViolationError (23503)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        purchaseOrderRepository.create({
          organization_id: orgAId,
          supplier_id: 'INVALID-SUPP',
          order_number: 'PO-INVALID-SUPP',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);

      await expect(
        purchaseOrderRepository.createItem({
          organization_id: orgAId,
          purchase_order_id: orderId,
          product_id: 'INVALID-PROD',
          quantity: '1.0000',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);
    });

    it('should map negative quantity or cost to CheckConstraintViolationError (23514)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        purchaseOrderRepository.createItem({
          organization_id: orgAId,
          purchase_order_id: orderId,
          product_id: productId,
          quantity: '-5.0000',
        }),
      ).rejects.toThrow(CheckConstraintViolationError);
    });
  });

  describe('Transaction Client Propagation & Security', () => {
    it('should propagate supplied PoolClient inside withTransaction for atomic purchase order creation', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        const header = await purchaseOrderRepository.create(
          {
            organization_id: orgAId,
            supplier_id: supplierId,
            order_number: 'PO-TX-001',
          },
          txClient,
        );

        await purchaseOrderRepository.createItem(
          {
            organization_id: orgAId,
            purchase_order_id: header.id,
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
