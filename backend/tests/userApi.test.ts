import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { userService } from '../src/services/user.service';
import { signAccessToken } from '../src/utils/jwt';
import { ConflictError } from '../src/types';

describe('Phase 048 — User Management REST API (/api/v1/users)', () => {
  const adminUserId = '11111111-1111-1111-1111-111111111111';
  const orgA = '22222222-2222-2222-2222-222222222222';
  const { accessToken } = signAccessToken(adminUserId, orgA);

  it('GET /api/v1/users should list users for authenticated tenant', async () => {
    vi.spyOn(userService, 'listUsersByOrganization').mockResolvedValueOnce({
      items: [
        {
          id: adminUserId,
          organization_id: orgA,
          name: 'Admin User',
          email: 'admin@acme.com',
          phone: null,
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
      .get('/api/v1/users?page=1&pageSize=10')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(1);
  });

  it('GET /api/v1/users/:id should return single user details', async () => {
    vi.spyOn(userService, 'getUserById').mockResolvedValueOnce({
      id: adminUserId,
      organization_id: orgA,
      name: 'Admin User',
      email: 'admin@acme.com',
      phone: null,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .get(`/api/v1/users/${adminUserId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(adminUserId);
  });

  it('POST /api/v1/users should create user and return 201 Created', async () => {
    vi.spyOn(userService, 'createUser').mockResolvedValueOnce({
      id: '33333333-3333-3333-3333-333333333333',
      organization_id: orgA,
      name: 'New Worker',
      email: 'worker@acme.com',
      phone: null,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'New Worker',
        email: 'worker@acme.com',
        password: 'ValidPassword123!',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('worker@acme.com');
  });

  it('POST /api/v1/users should return 409 Conflict for duplicate email', async () => {
    vi.spyOn(userService, 'createUser').mockRejectedValueOnce(
      new ConflictError("User with email 'existing@acme.com' already exists", 'USER_ALREADY_EXISTS'),
    );

    const response = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Existing User',
        email: 'existing@acme.com',
        password: 'ValidPassword123!',
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('USER_ALREADY_EXISTS');
  });

  it('PATCH /api/v1/users/:id/status should update user status', async () => {
    vi.spyOn(userService, 'getUserById').mockResolvedValueOnce({
      id: '33333333-3333-3333-3333-333333333333',
      organization_id: orgA,
      name: 'Worker',
      email: 'worker@acme.com',
      phone: null,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(userService, 'updateUserStatus').mockResolvedValueOnce({
      id: '33333333-3333-3333-3333-333333333333',
      organization_id: orgA,
      name: 'Worker',
      email: 'worker@acme.com',
      phone: null,
      status: 'suspended',
      created_at: new Date(),
      updated_at: new Date(),
    });

    const response = await request(app)
      .patch('/api/v1/users/33333333-3333-3333-3333-333333333333/status')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'suspended' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('suspended');
  });

  it('DELETE /api/v1/users/:id should deactivate user', async () => {
    vi.spyOn(userService, 'getUserById').mockResolvedValueOnce({
      id: '33333333-3333-3333-3333-333333333333',
      organization_id: orgA,
      name: 'Worker',
      email: 'worker@acme.com',
      phone: null,
      status: 'active',
      created_at: new Date(),
      updated_at: new Date(),
    });

    vi.spyOn(userService, 'deleteUser').mockResolvedValueOnce(true);

    const response = await request(app)
      .delete('/api/v1/users/33333333-3333-3333-3333-333333333333')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
