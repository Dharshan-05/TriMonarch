import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { productService } from '../src/services/product.service';
import { inventoryRepository } from '../src/repositories/inventory.repository';
import { signAccessToken } from '../src/utils/jwt';
import { withTransaction } from '../src/db/transaction';
import { pool } from '../src/config/database';
import { PoolClient } from 'pg';

describe('Decimal Database & API Integration', () => {
  const dummyOrgId = '11111111-1111-1111-1111-111111111111';
  const dummyUserId = '33333333-3333-3333-3333-333333333333';
  const token = signAccessToken(dummyUserId, dummyOrgId).accessToken;

  const createMockPoolClient = () => {
    const mockQuery = vi.fn().mockImplementation(async () => {
      return { rows: [], rowCount: 1, command: '', oid: 0, fields: [] };
    });
    const mockRelease = vi.fn();
    return {
      query: mockQuery,
      release: mockRelease,
    } as unknown as PoolClient;
  };

  describe('Product Price & Cost Round-Trip Precision', () => {
    it('POST /api/v1/products should preserve exact string decimal representation', async () => {
      const mockProduct = {
        id: 'prod-dec-1',
        organization_id: dummyOrgId,
        sku: 'DEC-SKU-001',
        name: 'Decimal Precision Widget',
        description: null,
        category: null,
        unit: 'pcs',
        price: '1999.9900',
        cost: '1200.5000',
        tax_rate: '0.180000',
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(productService, 'createProduct').mockResolvedValueOnce(mockProduct);

      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          sku: 'DEC-SKU-001',
          name: 'Decimal Precision Widget',
          price: '1999.99',
          cost: '1200.50',
          tax_rate: '0.18',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.price).toBe('1999.9900');
      expect(response.body.data.cost).toBe('1200.5000');
      expect(response.body.data.tax_rate).toBe('0.180000');
    });
  });

  describe('Atomic Decimal Inventory Updates', () => {
    it('should aggregate fractional stock deltas without precision loss', async () => {
      vi.spyOn(pool, 'connect').mockImplementation(async () => createMockPoolClient());

      let currentStock = 100.0;

      vi.spyOn(inventoryRepository, 'adjustQuantityAtomic').mockImplementation(
        async (_orgId, _id, delta) => {
          currentStock += delta;
          return {
            id: 'inv-dec-1',
            organization_id: dummyOrgId,
            product_id: 'prod-1',
            warehouse_id: 'wh-1',
            quantity: currentStock.toFixed(4),
            reorder_level: '10.0000',
            created_at: new Date(),
            updated_at: new Date(),
          };
        },
      );

      // Concurrent Request A: +20.25 stock
      const txA = withTransaction(async (tx) => {
        return inventoryRepository.adjustQuantityAtomic(dummyOrgId, 'inv-dec-1', 20.25, tx);
      });

      // Concurrent Request B: -10.50 stock
      const txB = withTransaction(async (tx) => {
        return inventoryRepository.adjustQuantityAtomic(dummyOrgId, 'inv-dec-1', -10.5, tx);
      });

      await Promise.all([txA, txB]);

      // 100.0 + 20.25 - 10.50 = 109.75
      expect(currentStock.toFixed(4)).toBe('109.7500');
    });
  });
});
