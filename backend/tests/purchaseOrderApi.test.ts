import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { purchaseOrderService } from '../src/services/purchaseOrder.service';
import { signAccessToken } from '../src/utils/jwt';
import { DuplicatePurchaseOrderNumberError } from '../src/types';

describe('Phase 053 — Purchase Order Management REST API (/api/v1/purchase-orders)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const purchaseOrderId = '33333333-3333-3333-3333-333333333333';
  const supplierId = '44444444-4444-4444-4444-444444444444';
  const productId = '55555555-5555-5555-5555-555555555555';
  const itemId = '66666666-6666-6666-6666-666666666666';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  it('GET /api/v1/purchase-orders should list purchase orders for authenticated tenant', async () => {
    vi.spyOn(purchaseOrderService, 'listPurchaseOrders').mockResolvedValueOnce({
      items: [
        {
          id: purchaseOrderId,
          organization_id: orgA,
          supplier_id: supplierId,
          warehouse_id: null,
          order_number: 'PO-1001',
          order_date: new Date(),
          expected_delivery_date: null,
          status: 'draft',
          currency: 'USD',
          subtotal: '100.0000',
          tax_amount: '10.0000',
          discount_amount: '0.0000',
          total_amount: '110.0000',
          notes: 'Test PO',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
      totalPages: 1,
    });

    const response = await request(app)
      .get('/api/v1/purchase-orders?page=1&pageSize=20')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].order_number).toBe('PO-1001');
  });

  it('POST /api/v1/purchase-orders should create purchase order with items and return 201 Created', async () => {
    vi.spyOn(purchaseOrderService, 'createPurchaseOrder').mockResolvedValueOnce({
      id: purchaseOrderId,
      organization_id: orgA,
      supplier_id: supplierId,
      warehouse_id: null,
      order_number: 'PO-1002',
      order_date: new Date(),
      expected_delivery_date: null,
      status: 'draft',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'PO with items',
      created_at: new Date(),
      updated_at: new Date(),
      items: [
        {
          id: itemId,
          organization_id: orgA,
          purchase_order_id: purchaseOrderId,
          product_id: productId,
          quantity: '2.0000',
          unit_cost: '50.0000',
          discount_amount: '0.0000',
          tax_rate: '10.000000',
          tax_amount: '10.0000',
          line_total: '110.0000',
          sequence: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
    });

    const response = await request(app)
      .post('/api/v1/purchase-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplier_id: supplierId,
        order_number: 'PO-1002',
        items: [
          {
            product_id: productId,
            quantity: '2.0000',
            unit_cost: '50.0000',
            tax_rate: '10.000000',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.order_number).toBe('PO-1002');
  });

  it('POST /api/v1/purchase-orders should return 409 Conflict on duplicate order number', async () => {
    vi.spyOn(purchaseOrderService, 'createPurchaseOrder').mockRejectedValueOnce(
      new DuplicatePurchaseOrderNumberError("Purchase order number 'PO-1002' already exists in organization"),
    );

    const response = await request(app)
      .post('/api/v1/purchase-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        supplier_id: supplierId,
        order_number: 'PO-1002',
        items: [
          {
            product_id: productId,
            quantity: '2.0000',
            unit_cost: '50.0000',
          },
        ],
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/v1/purchase-orders/:id should return single purchase order details', async () => {
    vi.spyOn(purchaseOrderService, 'getPurchaseOrder').mockResolvedValueOnce({
      id: purchaseOrderId,
      organization_id: orgA,
      supplier_id: supplierId,
      warehouse_id: null,
      order_number: 'PO-1001',
      order_date: new Date(),
      expected_delivery_date: null,
      status: 'draft',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'Test PO',
      created_at: new Date(),
      updated_at: new Date(),
      items: [],
    });

    const response = await request(app)
      .get(`/api/v1/purchase-orders/${purchaseOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(purchaseOrderId);
  });

  it('POST /api/v1/purchase-orders/:id/approve should approve purchase order', async () => {
    vi.spyOn(purchaseOrderService, 'getPurchaseOrder').mockResolvedValueOnce({
      id: purchaseOrderId,
      organization_id: orgA,
      supplier_id: supplierId,
      warehouse_id: null,
      order_number: 'PO-1001',
      order_date: new Date(),
      expected_delivery_date: null,
      status: 'submitted',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'Test PO',
      created_at: new Date(),
      updated_at: new Date(),
      items: [],
    });

    vi.spyOn(purchaseOrderService, 'approvePurchaseOrder').mockResolvedValueOnce({
      id: purchaseOrderId,
      organization_id: orgA,
      supplier_id: supplierId,
      warehouse_id: null,
      order_number: 'PO-1001',
      order_date: new Date(),
      expected_delivery_date: null,
      status: 'approved',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'Test PO',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .post(`/api/v1/purchase-orders/${purchaseOrderId}/approve`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('approved');
  });

  it('DELETE /api/v1/purchase-orders/:id should delete purchase order', async () => {
    vi.spyOn(purchaseOrderService, 'getPurchaseOrder').mockResolvedValueOnce({
      id: purchaseOrderId,
      organization_id: orgA,
      supplier_id: supplierId,
      warehouse_id: null,
      order_number: 'PO-1001',
      order_date: new Date(),
      expected_delivery_date: null,
      status: 'draft',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'Test PO',
      created_at: new Date(),
      updated_at: new Date(),
      items: [],
    });

    vi.spyOn(purchaseOrderService, 'deletePurchaseOrder').mockResolvedValueOnce(true);

    const response = await request(app)
      .delete(`/api/v1/purchase-orders/${purchaseOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
