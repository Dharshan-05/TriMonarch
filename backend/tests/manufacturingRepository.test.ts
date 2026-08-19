import { describe, it, expect, vi } from 'vitest';
import { manufacturingRepository } from '../src/repositories/manufacturing.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { handleDatabaseError, DuplicateKeyError, ForeignKeyViolationError, CheckConstraintViolationError } from '../src/db/errors';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('Manufacturing Repository Subsystem (Phase 016)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const orderId = 'mo-1111';
  const orderItemId = 'mo-item-2222';
  const bomId = 'bom-1111';
  const finishedProductId = 'prod-finished-1';
  const componentProductId = 'prod-component-1';

  const mockManufacturingOrder = {
    id: orderId,
    organization_id: orgAId,
    bom_id: bomId,
    product_id: finishedProductId,
    order_number: 'MO-2026-0001',
    planned_quantity: '100.2500',
    completed_quantity: '0.0001',
    scheduled_start_date: new Date(),
    scheduled_end_date: new Date(),
    actual_start_date: null,
    actual_end_date: null,
    status: 'draft' as const,
    notes: 'Standard production batch',
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockManufacturingOrderItem = {
    id: orderItemId,
    organization_id: orgAId,
    manufacturing_order_id: orderId,
    component_product_id: componentProductId,
    bom_item_id: 'bom-item-1',
    required_quantity: '100.2500',
    consumed_quantity: '0.0001',
    unit: 'pcs',
    sequence: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO manufacturing_orders')) {
      const orderNum = params?.[3] as string;
      const bId = params?.[1] as string;
      if (orderNum === 'MO-DUPLICATE') {
        throw handleDatabaseError({
          code: '23505',
          detail: 'Key (organization_id, order_number)=(11111111-1111-1111-1111-111111111111, MO-DUPLICATE) already exists.',
          constraint: 'uq_manufacturing_orders_org_number',
        });
      }
      if (bId === 'INVALID-BOM') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (bom_id)=(INVALID-BOM) is not present in table "boms".',
          constraint: 'manufacturing_orders_bom_id_fkey',
        });
      }
      return { rows: [mockManufacturingOrder], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('INSERT INTO manufacturing_order_items')) {
      const reqQty = params?.[4] as string;
      const compId = params?.[2] as string;
      if (reqQty.startsWith('-')) {
        throw handleDatabaseError({
          code: '23514',
          detail: 'Failing row contains negative quantity',
          constraint: 'manufacturing_order_items_required_quantity_check',
        });
      }
      if (compId === 'INVALID-COMP') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (component_product_id)=(INVALID-COMP) is not present in table "products".',
          constraint: 'manufacturing_order_items_component_product_id_fkey',
        });
      }
      return { rows: [mockManufacturingOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM manufacturing_order_items')) {
      const [id, orgId] = params as [string, string];
      if (id === orderItemId && orgId === orgAId) {
        return { rows: [{ id: orderItemId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM manufacturing_orders')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [{ id: orderId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM manufacturing_orders WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [mockManufacturingOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM manufacturing_orders WHERE order_number = $1 AND organization_id = $2')) {
      const [num, orgId] = params as [string, string];
      if (num === 'MO-2026-0001' && orgId === orgAId) {
        return { rows: [mockManufacturingOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM manufacturing_orders WHERE bom_id = $1 AND organization_id = $2')) {
      const [bId, orgId] = params as [string, string];
      if (bId === bomId && orgId === orgAId) {
        return { rows: [mockManufacturingOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM manufacturing_orders WHERE product_id = $1 AND organization_id = $2')) {
      const [pId, orgId] = params as [string, string];
      if (pId === finishedProductId && orgId === orgAId) {
        return { rows: [mockManufacturingOrder], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM manufacturing_order_items WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === orderItemId && orgId === orgAId) {
        return { rows: [mockManufacturingOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM manufacturing_order_items WHERE manufacturing_order_id = $1 AND organization_id = $2')) {
      const [moId, orgId] = params as [string, string];
      if (moId === orderId && orgId === orgAId) {
        return { rows: [mockManufacturingOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM manufacturing_order_items WHERE component_product_id = $1 AND organization_id = $2')) {
      const [cId, orgId] = params as [string, string];
      if (cId === componentProductId && orgId === orgAId) {
        return { rows: [mockManufacturingOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT 1 FROM manufacturing_orders')) {
      const [id, orgId] = params as [string, string];
      if (id === orderId && orgId === orgAId) {
        return { rows: [{ '?column?': 1 }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('COUNT(*) as count FROM manufacturing_orders')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE manufacturing_orders SET')) {
      return { rows: [mockManufacturingOrder], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE manufacturing_order_items SET')) {
      return { rows: [mockManufacturingOrderItem], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM manufacturing_orders')) {
      return { rows: [mockManufacturingOrder], rowCount: 1, command: '', oid: 0, fields: [] };
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

  describe('ManufacturingOrder Header CRUD Operations', () => {
    it('should create manufacturing order preserving exact NUMERIC quantities', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const created = await manufacturingRepository.create({
        organization_id: orgAId,
        bom_id: bomId,
        product_id: finishedProductId,
        order_number: 'MO-2026-0001',
        planned_quantity: '100.2500',
        completed_quantity: '0.0001',
      });

      expect(created.id).toBe(orderId);
      expect(created.planned_quantity).toBe('100.2500');
      expect(typeof created.planned_quantity).toBe('string');
      expect(created.completed_quantity).toBe('0.0001');
      expect(typeof created.completed_quantity).toBe('string');
    });

    it('should find manufacturing order by ID, order number, BOM ID, and Product ID with tenant isolation', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const byId = await manufacturingRepository.findById(orgAId, orderId);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(orderId);

      const byNum = await manufacturingRepository.findByOrderNumber(orgAId, 'MO-2026-0001');
      expect(byNum).not.toBeNull();

      const byBom = await manufacturingRepository.findByBomId(orgAId, bomId);
      expect(byBom.length).toBe(1);

      const byProd = await manufacturingRepository.findByProductId(orgAId, finishedProductId);
      expect(byProd.length).toBe(1);
    });

    it('should update manufacturing order status and quantities', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await manufacturingRepository.update(orgAId, orderId, { status: 'in_progress' });
      expect(updated).not.toBeNull();
    });

    it('should delete manufacturing order returning boolean status', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await manufacturingRepository.delete(orgAId, orderId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await manufacturingRepository.delete(orgBId, orderId);
      expect(crossTenantDelete).toBe(false);
    });

    it('should check manufacturing order existence via SELECT 1', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const existsOrgA = await manufacturingRepository.exists(orgAId, orderId);
      expect(existsOrgA).toBe(true);

      const existsOrgB = await manufacturingRepository.exists(orgBId, orderId);
      expect(existsOrgB).toBe(false);
    });
  });

  describe('ManufacturingOrder Material Item Operations', () => {
    it('should create manufacturing order item preserving exact NUMERIC quantities', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const item = await manufacturingRepository.createItem({
        organization_id: orgAId,
        manufacturing_order_id: orderId,
        component_product_id: componentProductId,
        required_quantity: '100.2500',
        consumed_quantity: '0.0001',
        unit: 'pcs',
        sequence: 1,
      });

      expect(item.id).toBe(orderItemId);
      expect(item.required_quantity).toBe('100.2500');
      expect(typeof item.required_quantity).toBe('string');
      expect(item.consumed_quantity).toBe('0.0001');
      expect(typeof item.consumed_quantity).toBe('string');
    });

    it('should list items for a manufacturing order and by component product', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const items = await manufacturingRepository.listItems(orgAId, orderId);
      expect(items.length).toBe(1);
      expect(items[0]!.id).toBe(orderItemId);

      const byProduct = await manufacturingRepository.listItemsByProduct(orgAId, componentProductId);
      expect(byProduct.length).toBe(1);
    });

    it('should update material requirement item details', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await manufacturingRepository.updateItem(orgAId, orderItemId, { consumed_quantity: '50.0000' });
      expect(updated).not.toBeNull();
    });

    it('should delete material requirement item returning boolean status', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await manufacturingRepository.deleteItem(orgAId, orderItemId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await manufacturingRepository.deleteItem(orgBId, orderItemId);
      expect(crossTenantDelete).toBe(false);
    });
  });

  describe('Multi-Tenant Cross-Tenant Isolation Test', () => {
    it('should deny cross-tenant access for order header and items when using Org B', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const crossOrder = await manufacturingRepository.findById(orgBId, orderId);
      expect(crossOrder).toBeNull();

      const crossOrderNum = await manufacturingRepository.findByOrderNumber(orgBId, 'MO-2026-0001');
      expect(crossOrderNum).toBeNull();

      const crossItems = await manufacturingRepository.listItems(orgBId, orderId);
      expect(crossItems.length).toBe(0);
    });
  });

  describe('Database Constraint Normalization', () => {
    it('should map duplicate order_number within organization to DuplicateKeyError (23505)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        manufacturingRepository.create({
          organization_id: orgAId,
          bom_id: bomId,
          product_id: finishedProductId,
          order_number: 'MO-DUPLICATE',
        }),
      ).rejects.toThrow(DuplicateKeyError);
    });

    it('should map invalid BOM or product FK to ForeignKeyViolationError (23503)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        manufacturingRepository.create({
          organization_id: orgAId,
          bom_id: 'INVALID-BOM',
          product_id: finishedProductId,
          order_number: 'MO-INVALID-BOM',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);

      await expect(
        manufacturingRepository.createItem({
          organization_id: orgAId,
          manufacturing_order_id: orderId,
          component_product_id: 'INVALID-COMP',
          required_quantity: '1.0000',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);
    });

    it('should map negative quantity to CheckConstraintViolationError (23514)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        manufacturingRepository.createItem({
          organization_id: orgAId,
          manufacturing_order_id: orderId,
          component_product_id: componentProductId,
          required_quantity: '-5.0000',
        }),
      ).rejects.toThrow(CheckConstraintViolationError);
    });
  });

  describe('Transaction Client Propagation & Security', () => {
    it('should propagate supplied PoolClient inside withTransaction for atomic manufacturing order creation', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        const header = await manufacturingRepository.create(
          {
            organization_id: orgAId,
            bom_id: bomId,
            product_id: finishedProductId,
            order_number: 'MO-TX-001',
          },
          txClient,
        );

        await manufacturingRepository.createItem(
          {
            organization_id: orgAId,
            manufacturing_order_id: header.id,
            component_product_id: componentProductId,
            required_quantity: '1.0000',
          },
          txClient,
        );
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject malicious sort parameter input via sort allowlist', () => {
      expect(() => sanitizeSortColumn('created_at; DROP TABLE users', ['order_number', 'planned_quantity'])).toThrow(
        ValidationError,
      );
    });
  });
});
