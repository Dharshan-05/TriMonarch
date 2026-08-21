import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { productService } from '../src/services/product.service';
import { signAccessToken } from '../src/utils/jwt';
import { DuplicateKeyError } from '../src/db/errors';

describe('Phase 050 — Product Management REST API (/api/v1/products)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const productId = '66666666-6666-6666-6666-666666666666';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  it('GET /api/v1/products should list products for authenticated tenant', async () => {
    vi.spyOn(productService, 'searchProducts').mockResolvedValueOnce({
      items: [
        {
          id: productId,
          organization_id: orgA,
          sku: 'SKU-100',
          name: 'Widget Alpha',
          description: 'High quality widget',
          category: 'Widgets',
          unit: 'pcs',
          price: '99.99',
          cost: '49.99',
          tax_rate: '0.05',
          status: 'active',
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
      .get('/api/v1/products?page=1&pageSize=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].sku).toBe('SKU-100');
  });

  it('POST /api/v1/products should create product and return 201 Created', async () => {
    vi.spyOn(productService, 'createProduct').mockResolvedValueOnce({
      id: productId,
      organization_id: orgA,
      sku: 'SKU-200',
      name: 'Widget Beta',
      description: null,
      category: null,
      unit: 'pcs',
      price: '149.99',
      cost: '79.99',
      tax_rate: '0.05',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sku: 'SKU-200',
        name: 'Widget Beta',
        price: '149.99',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.sku).toBe('SKU-200');
  });

  it('POST /api/v1/products should return 409 Conflict on duplicate SKU', async () => {
    vi.spyOn(productService, 'createProduct').mockRejectedValueOnce(
      new DuplicateKeyError("Product with SKU 'SKU-EXISTING' already exists in this organization", 'uq_products_org_sku'),
    );

    const response = await request(app)
      .post('/api/v1/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        sku: 'SKU-EXISTING',
        name: 'Duplicate Item',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/v1/products/:id should return single product details', async () => {
    vi.spyOn(productService, 'getProductById').mockResolvedValueOnce({
      id: productId,
      organization_id: orgA,
      sku: 'SKU-100',
      name: 'Widget Alpha',
      description: null,
      category: null,
      unit: 'pcs',
      price: '99.99',
      cost: '49.99',
      tax_rate: '0.05',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .get(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(productId);
  });

  it('PATCH /api/v1/products/:id/status should update product status', async () => {
    vi.spyOn(productService, 'getProductById').mockResolvedValueOnce({
      id: productId,
      organization_id: orgA,
      sku: 'SKU-100',
      name: 'Widget Alpha',
      description: null,
      category: null,
      unit: 'pcs',
      price: '99.99',
      cost: '49.99',
      tax_rate: '0.05',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(productService, 'updateProductStatus').mockResolvedValueOnce({
      id: productId,
      organization_id: orgA,
      sku: 'SKU-100',
      name: 'Widget Alpha',
      description: null,
      category: null,
      unit: 'pcs',
      price: '99.99',
      cost: '49.99',
      tax_rate: '0.05',
      status: 'discontinued',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .patch(`/api/v1/products/${productId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'discontinued' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('discontinued');
  });

  it('DELETE /api/v1/products/:id should delete product record', async () => {
    vi.spyOn(productService, 'getProductById').mockResolvedValueOnce({
      id: productId,
      organization_id: orgA,
      sku: 'SKU-100',
      name: 'Widget Alpha',
      description: null,
      category: null,
      unit: 'pcs',
      price: '99.99',
      cost: '49.99',
      tax_rate: '0.05',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(productService, 'deleteProduct').mockResolvedValueOnce(true);

    const response = await request(app)
      .delete(`/api/v1/products/${productId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
