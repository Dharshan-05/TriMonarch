import { describe, it, expect, vi } from 'vitest';
import { productService } from '../src/services/product.service';
import { productRepository } from '../src/repositories/product.repository';
import { auditService } from '../src/audit/audit.service';
import { pool } from '../src/config/database';
import { NotFoundError, ValidationError } from '../src/types';
import { DuplicateKeyError, ForeignKeyViolationError } from '../src/db/errors';
import { PoolClient } from 'pg';

describe('Product Service Subsystem (Phase 019)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const prodId = 'prod-1111';

  const mockProduct = {
    id: prodId,
    organization_id: orgAId,
    sku: 'PROD-WIDGET-001',
    name: 'Standard Widget Pro',
    description: 'High performance industrial widget',
    category: 'Electronics',
    unit: 'pcs',
    price: '1999.9900',
    cost: '1200.5000',
    tax_rate: '18.000000',
    status: 'active' as const,
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

  describe('Product Creation Workflow', () => {
    it('should create valid product and record Category A audit event atomically', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findBySku').mockResolvedValueOnce(null);
      vi.spyOn(productRepository, 'create').mockResolvedValueOnce(mockProduct);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'audit-1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'PRODUCT',
        entity_id: prodId,
        request_id: 'req-1',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const result = await productService.createProduct(
        {
          organization_id: orgAId,
          sku: 'prod-widget-001 ',
          name: ' Standard Widget Pro ',
          price: '1999.9900',
          cost: '1200.5000',
          tax_rate: '18.000000',
        },
        userAId,
        'req-1',
      );

      expect(result.id).toBe(prodId);
      expect(productRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sku: 'PROD-WIDGET-001',
          name: 'Standard Widget Pro',
          price: '1999.9900',
        }),
        mockClient,
      );
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATE',
          entity_id: prodId,
          request_id: 'req-1',
        }),
        mockClient,
      );
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject invalid payload (missing sku / name)', async () => {
      await expect(
        productService.createProduct({
          organization_id: orgAId,
          sku: '',
          name: '',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should reject negative price, negative cost, or out-of-range tax rate', async () => {
      await expect(
        productService.createProduct({
          organization_id: orgAId,
          sku: 'PROD-001',
          name: 'Widget',
          price: '-10.0000',
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        productService.createProduct({
          organization_id: orgAId,
          sku: 'PROD-001',
          name: 'Widget',
          cost: '-5.0000',
        }),
      ).rejects.toThrow(ValidationError);

      await expect(
        productService.createProduct({
          organization_id: orgAId,
          sku: 'PROD-001',
          name: 'Widget',
          tax_rate: '150.000000',
        }),
      ).rejects.toThrow(ValidationError);
    });

    it('should allow same SKU in different organization (Org B)', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findBySku').mockResolvedValueOnce(null);
      vi.spyOn(productRepository, 'create').mockResolvedValueOnce({ ...mockProduct, organization_id: orgBId });
      vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'audit-orgb',
        organization_id: orgBId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'PRODUCT',
        entity_id: prodId,
        request_id: 'req-b',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const res = await productService.createProduct({
        organization_id: orgBId,
        sku: 'PROD-WIDGET-001',
        name: 'Org B Widget',
      });

      expect(res.organization_id).toBe(orgBId);
    });

    it('should reject duplicate SKU in same organization', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findBySku').mockResolvedValueOnce(mockProduct);

      await expect(
        productService.createProduct({
          organization_id: orgAId,
          sku: 'PROD-WIDGET-001',
          name: 'Duplicate Widget',
        }),
      ).rejects.toThrow(DuplicateKeyError);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should roll back product creation if audit recording fails', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findBySku').mockResolvedValueOnce(null);
      vi.spyOn(productRepository, 'create').mockResolvedValueOnce(mockProduct);
      vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(new Error('Audit failure'));

      await expect(
        productService.createProduct(
          {
            organization_id: orgAId,
            sku: 'PROD-WIDGET-001',
            name: 'Widget',
          },
          userAId,
          'req-fail',
        ),
      ).rejects.toThrow('Audit failure');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('Product Retrieval Workflow', () => {
    it('should retrieve product by ID and by SKU with tenant isolation', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      const byId = await productService.getProductById(orgAId, prodId);
      expect(byId.id).toBe(prodId);

      vi.spyOn(productRepository, 'findBySku').mockResolvedValueOnce(mockProduct);
      const bySku = await productService.getProductBySku(orgAId, 'PROD-WIDGET-001');
      expect(bySku.id).toBe(prodId);
    });

    it('should throw NotFoundError if product is not found', async () => {
      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(null);
      await expect(productService.getProductById(orgAId, 'missing-id')).rejects.toThrow(NotFoundError);

      vi.spyOn(productRepository, 'findBySku').mockResolvedValueOnce(null);
      await expect(productService.getProductBySku(orgAId, 'missing-sku')).rejects.toThrow(NotFoundError);
    });
  });

  describe('Product Update Workflow', () => {
    it('should update product details and compute correct audit diff in transaction', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const updatedProd = { ...mockProduct, price: '2499.9900', name: 'Updated Widget Name' };

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(productRepository, 'update').mockResolvedValueOnce(updatedProd);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'audit-2',
        organization_id: orgAId,
        user_id: userAId,
        action: 'UPDATE',
        entity_type: 'PRODUCT',
        entity_id: prodId,
        request_id: 'req-update',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const result = await productService.updateProduct(
        orgAId,
        prodId,
        { price: '2499.9900', name: 'Updated Widget Name' },
        userAId,
        'req-update',
      );

      expect(result.price).toBe('2499.9900');
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATE',
          entity_id: prodId,
          metadata: expect.objectContaining({
            changes: expect.objectContaining({
              price: { before: '1999.9900', after: '2499.9900' },
            }),
          }),
        }),
        mockClient,
      );
    });

    it('should reject SKU update if SKU collides with another product in same organization', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const otherProd = { ...mockProduct, id: 'other-prod-id', sku: 'COLLISION-SKU' };

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(productRepository, 'findBySku').mockResolvedValueOnce(otherProd);

      await expect(
        productService.updateProduct(orgAId, prodId, { sku: 'COLLISION-SKU' }, userAId),
      ).rejects.toThrow(DuplicateKeyError);
    });
  });

  describe('Product Deletion Workflow', () => {
    it('should delete product and record DELETE audit event atomically', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(productRepository, 'delete').mockResolvedValueOnce(true);
      const auditSpy = vi.spyOn(auditService, 'recordAuditEvent').mockResolvedValueOnce({
        id: 'audit-del',
        organization_id: orgAId,
        user_id: userAId,
        action: 'DELETE',
        entity_type: 'PRODUCT',
        entity_id: prodId,
        request_id: 'req-del',
        success: true,
        metadata: {},
        created_at: new Date(),
      });

      const deleted = await productService.deleteProduct(orgAId, prodId, userAId, 'req-del');

      expect(deleted).toBe(true);
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETE',
          entity_id: prodId,
        }),
        mockClient,
      );
    });

    it('should normalize FK reference restrictions on product deletion', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      vi.spyOn(productRepository, 'findById').mockResolvedValueOnce(mockProduct);
      vi.spyOn(productRepository, 'delete').mockRejectedValueOnce(
        new ForeignKeyViolationError('Product is referenced by existing BOM or Sales Order', 'boms_product_id_fkey'),
      );

      await expect(productService.deleteProduct(orgAId, prodId, userAId)).rejects.toThrow(
        ForeignKeyViolationError,
      );
    });
  });

  describe('Product List & Search Operations', () => {
    it('should delegate list and search to productRepository with tenant scope', async () => {
      const mockPaginated = {
        items: [mockProduct],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.spyOn(productRepository, 'search').mockResolvedValue(mockPaginated);

      const listRes = await productService.listProducts(orgAId, { query: 'Widget', category: 'Electronics' });
      expect(listRes.items.length).toBe(1);

      const searchRes = await productService.searchProducts(orgAId, { query: 'Widget' });
      expect(searchRes.items.length).toBe(1);
    });
  });
});
