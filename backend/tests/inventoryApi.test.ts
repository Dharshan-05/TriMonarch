import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { inventoryService } from '../src/services/inventory.service';
import { signAccessToken } from '../src/utils/jwt';
import { ProductNotFoundError } from '../src/types';

describe('Phase 051 — Inventory Management REST API (/api/v1/inventory)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const inventoryId = '77777777-7777-7777-7777-777777777777';
  const productId = '88888888-8888-8888-8888-888888888888';
  const warehouseId = '99999999-9999-9999-9999-999999999999';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  it('GET /api/v1/inventory should list inventory for authenticated tenant', async () => {
    vi.spyOn(inventoryService, 'listInventoryByOrganization').mockResolvedValueOnce({
      items: [
        {
          id: inventoryId,
          organization_id: orgA,
          product_id: productId,
          warehouse_id: warehouseId,
          quantity: '100.0000',
          reorder_level: '10.0000',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    const response = await request(app)
      .get('/api/v1/inventory?page=1&pageSize=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].quantity).toBe('100.0000');
  });

  it('POST /api/v1/inventory should create inventory record and return 201 Created', async () => {
    vi.spyOn(inventoryService, 'createInventory').mockResolvedValueOnce({
      id: inventoryId,
      organization_id: orgA,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: '50.0000',
      reorder_level: '5.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .post('/api/v1/inventory')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: '50.0000',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.product_id).toBe(productId);
  });

  it('POST /api/v1/inventory should return 404 if product does not exist', async () => {
    vi.spyOn(inventoryService, 'createInventory').mockRejectedValueOnce(
      new ProductNotFoundError(`Product with ID ${productId} not found`),
    );

    const response = await request(app)
      .post('/api/v1/inventory')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: '50.0000',
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/v1/inventory/:id should return single inventory item', async () => {
    vi.spyOn(inventoryService, 'getInventoryById').mockResolvedValueOnce({
      id: inventoryId,
      organization_id: orgA,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: '100.0000',
      reorder_level: '10.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .get(`/api/v1/inventory/${inventoryId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(inventoryId);
  });

  it('PATCH /api/v1/inventory/:id/adjust should perform stock adjustment', async () => {
    vi.spyOn(inventoryService, 'getInventoryById').mockResolvedValueOnce({
      id: inventoryId,
      organization_id: orgA,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: '100.0000',
      reorder_level: '10.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(inventoryService, 'adjustStockById').mockResolvedValueOnce({
      id: inventoryId,
      organization_id: orgA,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: '110.0000',
      reorder_level: '10.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .patch(`/api/v1/inventory/${inventoryId}/adjust`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        delta_quantity: '10.0000',
        reason: 'Physical count adjustment',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.quantity).toBe('110.0000');
  });

  it('DELETE /api/v1/inventory/:id should delete inventory item', async () => {
    vi.spyOn(inventoryService, 'getInventoryById').mockResolvedValueOnce({
      id: inventoryId,
      organization_id: orgA,
      product_id: productId,
      warehouse_id: warehouseId,
      quantity: '100.0000',
      reorder_level: '10.0000',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(inventoryService, 'deleteInventory').mockResolvedValueOnce(true);

    const response = await request(app)
      .delete(`/api/v1/inventory/${inventoryId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
