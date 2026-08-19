import { describe, it, expect, vi } from 'vitest';
import { bomRepository } from '../src/repositories/bom.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { handleDatabaseError, DuplicateKeyError, ForeignKeyViolationError, CheckConstraintViolationError } from '../src/db/errors';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('BOM Repository Subsystem (Phase 013)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const bomId = 'bom-1111';
  const bomItemId = 'bom-item-2222';
  const finishedProductId = 'prod-finished-1';
  const componentProductId = 'prod-component-1';

  const mockBom = {
    id: bomId,
    organization_id: orgAId,
    product_id: finishedProductId,
    bom_code: 'BOM-WIDGET-001',
    name: 'Standard Widget Assembly',
    version: 1,
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockBomItem = {
    id: bomItemId,
    organization_id: orgAId,
    bom_id: bomId,
    component_product_id: componentProductId,
    quantity: '2.5000',
    unit: 'pcs',
    sequence: 1,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO boms')) {
      const code = params?.[2] as string;
      const productId = params?.[1] as string;
      if (code === 'BOM-DUPLICATE') {
        throw handleDatabaseError({
          code: '23505',
          detail: 'Key (organization_id, bom_code)=(11111111-1111-1111-1111-111111111111, BOM-DUPLICATE) already exists.',
          constraint: 'uq_boms_org_code',
        });
      }
      if (productId === 'INVALID-PROD') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (product_id)=(INVALID-PROD) is not present in table "products".',
          constraint: 'boms_product_id_fkey',
        });
      }
      return { rows: [mockBom], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('INSERT INTO bom_items')) {
      const qty = params?.[3] as string;
      const componentId = params?.[2] as string;
      if (qty.startsWith('-')) {
        throw handleDatabaseError({
          code: '23514',
          detail: 'Failing row contains negative quantity',
          constraint: 'bom_items_quantity_check',
        });
      }
      if (componentId === 'INVALID-COMP') {
        throw handleDatabaseError({
          code: '23503',
          detail: 'Key (component_product_id)=(INVALID-COMP) is not present in table "products".',
          constraint: 'bom_items_component_product_id_fkey',
        });
      }
      return { rows: [mockBomItem], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM bom_items')) {
      const [id, orgId] = params as [string, string];
      if (id === bomItemId && orgId === orgAId) {
        return { rows: [{ id: bomItemId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM boms')) {
      const [id, orgId] = params as [string, string];
      if (id === bomId && orgId === orgAId) {
        return { rows: [{ id: bomId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM boms WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === bomId && orgId === orgAId) {
        return { rows: [mockBom], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM boms WHERE bom_code = $1 AND organization_id = $2')) {
      const [code, orgId] = params as [string, string];
      if (code === 'BOM-WIDGET-001' && orgId === orgAId) {
        return { rows: [mockBom], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM boms WHERE product_id = $1 AND organization_id = $2')) {
      const [pId, orgId] = params as [string, string];
      if (pId === finishedProductId && orgId === orgAId) {
        return { rows: [mockBom], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM bom_items WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === bomItemId && orgId === orgAId) {
        return { rows: [mockBomItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM bom_items WHERE bom_id = $1 AND organization_id = $2')) {
      const [bId, orgId] = params as [string, string];
      if (bId === bomId && orgId === orgAId) {
        return { rows: [mockBomItem], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT 1 FROM boms')) {
      const [id, orgId] = params as [string, string];
      if (id === bomId && orgId === orgAId) {
        return { rows: [{ '?column?': 1 }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('COUNT(*) as count FROM boms')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE boms SET')) {
      return { rows: [mockBom], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE bom_items SET')) {
      return { rows: [mockBomItem], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM boms')) {
      return { rows: [mockBom], rowCount: 1, command: '', oid: 0, fields: [] };
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

  describe('BOM Header Repository Operations', () => {
    it('should create BOM header record cleanly', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const created = await bomRepository.create({
        organization_id: orgAId,
        product_id: finishedProductId,
        bom_code: 'BOM-WIDGET-001',
        name: 'Standard Widget Assembly',
      });

      expect(created.id).toBe(bomId);
      expect(created.bom_code).toBe('BOM-WIDGET-001');
    });

    it('should find BOM by ID, Code, and Product ID with tenant isolation', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const byId = await bomRepository.findById(orgAId, bomId);
      expect(byId).not.toBeNull();
      expect(byId?.id).toBe(bomId);

      const byCode = await bomRepository.findByCode(orgAId, 'BOM-WIDGET-001');
      expect(byCode).not.toBeNull();

      const byProduct = await bomRepository.findByProductId(orgAId, finishedProductId);
      expect(byProduct.length).toBe(1);
    });

    it('should update BOM header attributes', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await bomRepository.update(orgAId, bomId, { version: 2 });
      expect(updated).not.toBeNull();
    });

    it('should delete BOM header returning boolean status', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await bomRepository.delete(orgAId, bomId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await bomRepository.delete(orgBId, bomId);
      expect(crossTenantDelete).toBe(false);
    });

    it('should check BOM existence via SELECT 1', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const existsOrgA = await bomRepository.exists(orgAId, bomId);
      expect(existsOrgA).toBe(true);

      const existsOrgB = await bomRepository.exists(orgBId, bomId);
      expect(existsOrgB).toBe(false);
    });
  });

  describe('BOM Item Repository Operations', () => {
    it('should create BOM item preserving exact NUMERIC quantity string', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const item = await bomRepository.createItem({
        organization_id: orgAId,
        bom_id: bomId,
        component_product_id: componentProductId,
        quantity: '2.5000',
        unit: 'pcs',
        sequence: 1,
      });

      expect(item.id).toBe(bomItemId);
      expect(item.quantity).toBe('2.5000');
      expect(typeof item.quantity).toBe('string');
    });

    it('should list BOM items for a given BOM', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const items = await bomRepository.listItems(orgAId, bomId);
      expect(items.length).toBe(1);
      expect(items[0]!.id).toBe(bomItemId);
    });

    it('should update BOM item attributes', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await bomRepository.updateItem(orgAId, bomItemId, { quantity: '3.0000' });
      expect(updated).not.toBeNull();
    });

    it('should delete BOM item returning boolean result', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await bomRepository.deleteItem(orgAId, bomItemId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await bomRepository.deleteItem(orgBId, bomItemId);
      expect(crossTenantDelete).toBe(false);
    });
  });

  describe('Multi-Tenant Cross-Tenant Isolation Test', () => {
    it('should deny cross-tenant access for BOM header and items when using Org B', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const crossBom = await bomRepository.findById(orgBId, bomId);
      expect(crossBom).toBeNull();

      const crossItems = await bomRepository.listItems(orgBId, bomId);
      expect(crossItems.length).toBe(0);
    });
  });

  describe('Database Constraint Normalization', () => {
    it('should map duplicate BOM code to DuplicateKeyError (23505)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        bomRepository.create({
          organization_id: orgAId,
          product_id: finishedProductId,
          bom_code: 'BOM-DUPLICATE',
          name: 'Duplicate BOM',
        }),
      ).rejects.toThrow(DuplicateKeyError);
    });

    it('should map invalid product foreign keys to ForeignKeyViolationError (23503)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        bomRepository.create({
          organization_id: orgAId,
          product_id: 'INVALID-PROD',
          bom_code: 'BOM-INVALID',
          name: 'Invalid Product BOM',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);

      await expect(
        bomRepository.createItem({
          organization_id: orgAId,
          bom_id: bomId,
          component_product_id: 'INVALID-COMP',
          quantity: '1.0000',
        }),
      ).rejects.toThrow(ForeignKeyViolationError);
    });

    it('should map negative quantity to CheckConstraintViolationError (23514)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        bomRepository.createItem({
          organization_id: orgAId,
          bom_id: bomId,
          component_product_id: componentProductId,
          quantity: '-1.0000',
        }),
      ).rejects.toThrow(CheckConstraintViolationError);
    });
  });

  describe('Transaction Client Propagation & Security', () => {
    it('should propagate supplied PoolClient inside withTransaction for atomic BOM creation', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        const header = await bomRepository.create(
          {
            organization_id: orgAId,
            product_id: finishedProductId,
            bom_code: 'BOM-TX',
            name: 'Tx BOM',
          },
          txClient,
        );

        await bomRepository.createItem(
          {
            organization_id: orgAId,
            bom_id: header.id,
            component_product_id: componentProductId,
            quantity: '1.0000',
          },
          txClient,
        );
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject malicious sort parameter input via sort allowlist', () => {
      expect(() => sanitizeSortColumn('created_at; DROP TABLE products', ['name', 'bom_code'])).toThrow(
        ValidationError,
      );
    });
  });
});
