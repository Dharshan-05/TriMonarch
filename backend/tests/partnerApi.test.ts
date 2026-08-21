import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { partnerService } from '../src/services/partner.service';
import { signAccessToken } from '../src/utils/jwt';

describe('Phase 049 — Partner Management REST API (/api/v1/partners)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const partnerId = '44444444-4444-4444-4444-444444444444';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  it('GET /api/v1/partners should list customer partners for authenticated tenant', async () => {
    vi.spyOn(partnerService, 'listCustomers').mockResolvedValueOnce({
      items: [
        {
          id: partnerId,
          organization_id: orgA,
          name: 'Acme Corp',
          email: 'acme@corp.com',
          phone: '1234567890',
          address: '123 Business Way',
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
      .get('/api/v1/partners?type=customer')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toBe('Acme Corp');
  });

  it('POST /api/v1/partners should create a partner and return 201 Created', async () => {
    vi.spyOn(partnerService, 'createCustomer').mockResolvedValueOnce({
      id: '55555555-5555-5555-5555-555555555555',
      organization_id: orgA,
      name: 'Beta Global',
      email: 'beta@global.com',
      phone: '9876543210',
      address: '456 Tech Park',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .post('/api/v1/partners')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        type: 'customer',
        name: 'Beta Global',
        email: 'beta@global.com',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Beta Global');
  });

  it('GET /api/v1/partners/:id should return single partner details', async () => {
    vi.spyOn(partnerService, 'getCustomerById').mockResolvedValueOnce({
      id: partnerId,
      organization_id: orgA,
      name: 'Acme Corp',
      email: 'acme@corp.com',
      phone: '1234567890',
      address: '123 Business Way',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .get(`/api/v1/partners/${partnerId}?type=customer`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(partnerId);
  });

  it('PATCH /api/v1/partners/:id should update partner details', async () => {
    vi.spyOn(partnerService, 'getCustomerById').mockResolvedValueOnce({
      id: partnerId,
      organization_id: orgA,
      name: 'Acme Corp',
      email: 'acme@corp.com',
      phone: '1234567890',
      address: '123 Business Way',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(partnerService, 'updateCustomer').mockResolvedValueOnce({
      id: partnerId,
      organization_id: orgA,
      name: 'Acme International',
      email: 'acme@corp.com',
      phone: '1234567890',
      address: '123 Business Way',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .patch(`/api/v1/partners/${partnerId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ type: 'customer', name: 'Acme International' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Acme International');
  });

  it('DELETE /api/v1/partners/:id should delete partner record', async () => {
    vi.spyOn(partnerService, 'getCustomerById').mockResolvedValueOnce({
      id: partnerId,
      organization_id: orgA,
      name: 'Acme Corp',
      email: 'acme@corp.com',
      phone: '1234567890',
      address: '123 Business Way',
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(partnerService, 'deleteCustomer').mockResolvedValueOnce(true);

    const response = await request(app)
      .delete(`/api/v1/partners/${partnerId}?type=customer`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
