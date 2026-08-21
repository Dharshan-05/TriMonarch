import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { salesOrderService } from '../src/services/salesOrder.service';
import { salesOrderStateMachineService } from '../src/services/salesOrderStateMachine.service';
import { signAccessToken } from '../src/utils/jwt';
import { DuplicateOrderNumberError } from '../src/types';

describe('Phase 052 — Sales Order Management REST API (/api/v1/sales-orders)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const salesOrderId = '33333333-3333-3333-3333-333333333333';
  const customerId = '44444444-4444-4444-4444-444444444444';
  const productId = '55555555-5555-5555-5555-555555555555';
  const itemId = '66666666-6666-6666-6666-666666666666';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  it('GET /api/v1/sales-orders should list sales orders for authenticated tenant', async () => {
    vi.spyOn(salesOrderService, 'listSalesOrders').mockResolvedValueOnce({
      items: [
        {
          id: salesOrderId,
          organization_id: orgA,
          customer_id: customerId,
          order_number: 'SO-1001',
          order_date: new Date(),
          status: 'draft',
          currency: 'USD',
          subtotal: '100.0000',
          tax_amount: '10.0000',
          discount_amount: '0.0000',
          total_amount: '110.0000',
          notes: 'Test order',
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
      .get('/api/v1/sales-orders?page=1&pageSize=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].order_number).toBe('SO-1001');
  });

  it('POST /api/v1/sales-orders should create sales order with items and return 201 Created', async () => {
    vi.spyOn(salesOrderService, 'createSalesOrderWithItems').mockResolvedValueOnce({
      order: {
        id: salesOrderId,
        organization_id: orgA,
        customer_id: customerId,
        order_number: 'SO-1002',
        order_date: new Date(),
        status: 'draft',
        currency: 'USD',
        subtotal: '100.0000',
        tax_amount: '10.0000',
        discount_amount: '0.0000',
        total_amount: '110.0000',
        notes: 'Order with items',
        created_at: new Date(),
        updated_at: new Date(),
      },
      items: [
        {
          id: itemId,
          organization_id: orgA,
          sales_order_id: salesOrderId,
          product_id: productId,
          quantity: '2.0000',
          unit_price: '50.0000',
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
      .post('/api/v1/sales-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerId,
        order_number: 'SO-1002',
        items: [
          {
            product_id: productId,
            quantity: '2.0000',
            unit_price: '50.0000',
            tax_rate: '10.000000',
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.order.order_number).toBe('SO-1002');
  });

  it('POST /api/v1/sales-orders should return 409 Conflict on duplicate order number', async () => {
    vi.spyOn(salesOrderService, 'createSalesOrderWithItems').mockRejectedValueOnce(
      new DuplicateOrderNumberError("Sales order number 'SO-1002' already exists in organization"),
    );

    const response = await request(app)
      .post('/api/v1/sales-orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        customer_id: customerId,
        order_number: 'SO-1002',
        items: [
          {
            product_id: productId,
            quantity: '2.0000',
            unit_price: '50.0000',
          },
        ],
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  it('GET /api/v1/sales-orders/:id should return single order details and line items', async () => {
    vi.spyOn(salesOrderService, 'getSalesOrderById').mockResolvedValueOnce({
      id: salesOrderId,
      organization_id: orgA,
      customer_id: customerId,
      order_number: 'SO-1001',
      order_date: new Date(),
      status: 'draft',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'Test order',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(salesOrderService, 'getSalesOrderItems').mockResolvedValueOnce([]);

    const response = await request(app)
      .get(`/api/v1/sales-orders/${salesOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.order.id).toBe(salesOrderId);
  });

  it('PATCH /api/v1/sales-orders/:id/status should update status to confirmed', async () => {
    vi.spyOn(salesOrderService, 'getSalesOrderById').mockResolvedValueOnce({
      id: salesOrderId,
      organization_id: orgA,
      customer_id: customerId,
      order_number: 'SO-1001',
      order_date: new Date(),
      status: 'draft',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'Test order',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(salesOrderStateMachineService, 'transitionSalesOrder').mockResolvedValueOnce({
      id: salesOrderId,
      organization_id: orgA,
      customer_id: customerId,
      order_number: 'SO-1001',
      order_date: new Date(),
      status: 'confirmed',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'Test order',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .patch(`/api/v1/sales-orders/${salesOrderId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'confirmed' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('confirmed');
  });

  it('DELETE /api/v1/sales-orders/:id should delete sales order', async () => {
    vi.spyOn(salesOrderService, 'getSalesOrderById').mockResolvedValueOnce({
      id: salesOrderId,
      organization_id: orgA,
      customer_id: customerId,
      order_number: 'SO-1001',
      order_date: new Date(),
      status: 'draft',
      currency: 'USD',
      subtotal: '100.0000',
      tax_amount: '10.0000',
      discount_amount: '0.0000',
      total_amount: '110.0000',
      notes: 'Test order',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(salesOrderService, 'deleteSalesOrder').mockResolvedValueOnce(true);

    const response = await request(app)
      .delete(`/api/v1/sales-orders/${salesOrderId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
