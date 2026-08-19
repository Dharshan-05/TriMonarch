import { describe, it, expect, vi } from 'vitest';
import { productRepository } from '../src/repositories/product.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { handleDatabaseError, DuplicateKeyError } from '../src/db/errors';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('Product Repository Subsystem (Phase 012)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const productId = 'prod-1111';

  const mockProduct = {
    id: productId,
    organization_id: orgAId,
    sku: 'SKU-WIDGET-01',
    name: 'Industrial Widget Alpha',
    description: 'High-grade precision component',
    category: 'Electronics',
    unit: 'pcs',
    price: '1999.9900',
    cost: '1200.5000',
    tax_rate: '18.000000',
    status: 'active' as const,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO products')) {
      const sku = params?.[1] as string;
      if (sku === 'SKU-DUPLICATE') {
        throw handleDatabaseError({
          code: '23505',
          detail: 'Key (organization_id, sku)=(11111111-1111-1111-1111-111111111111, SKU-DUPLICATE) already exists.',
          constraint: 'uq_products_org_sku',
        });
      }
      return { rows: [mockProduct], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('DELETE FROM products')) {
      const [id, orgId] = params as [string, string];
      if (id === productId && orgId === orgAId) {
        return { rows: [{ id: productId }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM products WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === productId && orgId === orgAId) {
        return { rows: [mockProduct], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM products WHERE sku = $1 AND organization_id = $2')) {
      const [sku, orgId] = params as [string, string];
      if (sku === 'SKU-WIDGET-01' && orgId === orgAId) {
        return { rows: [mockProduct], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT 1 FROM products')) {
      const [id, orgId] = params as [string, string];
      if (id === productId && orgId === orgAId) {
        return { rows: [{ '?column?': 1 }], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('COUNT(*) as count FROM products')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('UPDATE products SET')) {
      return { rows: [mockProduct], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM products')) {
      return { rows: [mockProduct], rowCount: 1, command: '', oid: 0, fields: [] };
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

  describe('ProductRepository CRUD Operations', () => {
    it('should create product entity preserving exact NUMERIC decimal strings', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const created = await productRepository.create({
        organization_id: orgAId,
        sku: 'SKU-WIDGET-01',
        name: 'Industrial Widget Alpha',
        price: '1999.9900',
        cost: '1200.5000',
        tax_rate: '18.000000',
      });

      expect(created.id).toBe(productId);
      expect(created.price).toBe('1999.9900');
      expect(typeof created.price).toBe('string');
      expect(created.cost).toBe('1200.5000');
      expect(typeof created.cost).toBe('string');
      expect(created.tax_rate).toBe('18.000000');
      expect(typeof created.tax_rate).toBe('string');
    });

    it('should find product by ID with organization scope', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const product = await productRepository.findById(orgAId, productId);
      expect(product).not.toBeNull();
      expect(product?.sku).toBe('SKU-WIDGET-01');
    });

    it('should find product by SKU with organization scope', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const product = await productRepository.findBySku(orgAId, 'SKU-WIDGET-01');
      expect(product).not.toBeNull();
      expect(product?.name).toBe('Industrial Widget Alpha');
    });

    it('should update product attributes cleanly', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const updated = await productRepository.update(orgAId, productId, { price: '2100.0000' });
      expect(updated).not.toBeNull();
    });

    it('should delete product returning boolean status', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const deleted = await productRepository.delete(orgAId, productId);
      expect(deleted).toBe(true);

      const crossTenantDelete = await productRepository.delete(orgBId, productId);
      expect(crossTenantDelete).toBe(false);
    });

    it('should check product existence via SELECT 1', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const existsOrgA = await productRepository.exists(orgAId, productId);
      expect(existsOrgA).toBe(true);

      const existsOrgB = await productRepository.exists(orgBId, productId);
      expect(existsOrgB).toBe(false);
    });
  });

  describe('Multi-Tenant Organization Isolation Test', () => {
    it('should deny cross-tenant access when querying by ID or SKU using wrong organization_id', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const crossId = await productRepository.findById(orgBId, productId);
      expect(crossId).toBeNull();

      const crossSku = await productRepository.findBySku(orgBId, 'SKU-WIDGET-01');
      expect(crossSku).toBeNull();
    });
  });

  describe('Database Constraint Handling', () => {
    it('should map duplicate SKU violation within organization to DuplicateKeyError (23505)', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      await expect(
        productRepository.create({
          organization_id: orgAId,
          sku: 'SKU-DUPLICATE',
          name: 'Duplicate Widget',
        }),
      ).rejects.toThrow(DuplicateKeyError);
    });
  });

  describe('Search, Filtering, & Pagination', () => {
    it('should search products with pagination metadata', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const result = await productRepository.search(orgAId, {
        query: 'Widget',
        category: 'Electronics',
        status: 'active',
        page: 1,
        pageSize: 10,
      });

      expect(result.items.length).toBe(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
    });
  });

  describe('Transaction Client Propagation & SQL Injection Protection', () => {
    it('should propagate supplied PoolClient in withTransaction', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        await productRepository.create(
          { organization_id: orgAId, sku: 'SKU-TX', name: 'Tx Product' },
          txClient,
        );
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject malicious sort parameters via sort allowlist', () => {
      expect(() => sanitizeSortColumn('created_at; DROP TABLE users', ['name', 'price'])).toThrow(
        ValidationError,
      );
    });
  });
});
