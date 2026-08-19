import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import * as organizationServiceModule from '../src/services/organization.service';
import * as userServiceModule from '../src/services/user.service';
import { NotFoundError } from '../src/types';
import { signAccessToken } from '../src/utils/jwt';

describe('REST API Foundation & Endpoints (/api/v1)', () => {
  const dummyOrgId = '11111111-1111-1111-1111-111111111111';
  const dummyUserId = '33333333-3333-3333-3333-333333333333';
  const validToken = signAccessToken(dummyUserId, dummyOrgId).accessToken;

  it('should return x-request-id header in API responses', async () => {
    const response = await request(app).get('/health');
    expect(response.headers['x-request-id']).toBeDefined();
  });

  it('GET /api/v1/docs should return OpenAPI specification', async () => {
    const response = await request(app).get('/api/v1/docs');
    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe('3.0.3');
    expect(response.body.info.title).toContain('ERP Backend Service API');
  });

  describe('Organizations API (/api/v1/organizations)', () => {
    it('POST /api/v1/organizations should create organization and return 201 Created when authenticated', async () => {
      const mockOrg = {
        id: dummyOrgId,
        name: 'Apex Corp',
        code: 'APEX_CORP',
        description: 'Test Description',
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(organizationServiceModule.organizationService, 'createOrganization').mockResolvedValueOnce(mockOrg);

      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Apex Corp', code: 'APEX_CORP', description: 'Test Description' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: dummyOrgId,
          name: 'Apex Corp',
          code: 'APEX_CORP',
        },
      });
      expect(response.body.meta.requestId).toBeDefined();
    });

    it('GET /api/v1/organizations/:id should return 200 OK when authenticated', async () => {
      const mockOrg = {
        id: dummyOrgId,
        name: 'Apex Corp',
        code: 'APEX_CORP',
        description: null,
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(organizationServiceModule.organizationService, 'getOrganizationById').mockResolvedValueOnce(mockOrg);

      const response = await request(app)
        .get(`/api/v1/organizations/${dummyOrgId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(dummyOrgId);
    });

    it('DELETE /api/v1/organizations/:id should return 204 No Content when authenticated', async () => {
      vi.spyOn(organizationServiceModule.organizationService, 'deleteOrganization').mockResolvedValueOnce(true);

      const response = await request(app)
        .delete(`/api/v1/organizations/${dummyOrgId}`)
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(204);
    });
  });

  describe('Users API (/api/v1/users)', () => {
    it('GET /api/v1/users should list users for authenticated organization context', async () => {
      const mockUsers = {
        items: [
          {
            id: 'user-123',
            organization_id: dummyOrgId,
            name: 'Alice User',
            email: 'alice@example.com',
            phone: null,
            status: 'active' as const,
            created_at: new Date(),
            updated_at: new Date(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.spyOn(userServiceModule.userService, 'listUsersByOrganization').mockResolvedValueOnce(mockUsers);

      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.meta.total).toBe(1);
    });
  });

  describe('Negative & Security Testing', () => {
    it('should return 401 Unauthorized for unauthenticated requests on protected endpoints', async () => {
      const response = await request(app).get('/api/v1/users');
      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
    });

    it('should return 400 Bad Request for malformed UUID parameters', async () => {
      const response = await request(app)
        .get('/api/v1/organizations/not-a-valid-uuid')
        .set('Authorization', `Bearer ${validToken}`);
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 Bad Request for missing required body fields', async () => {
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 Bad Request for invalid enum status values', async () => {
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${validToken}`)
        .send({
          name: 'Bad Status Corp',
          code: 'BAD_STATUS',
          status: 'super_active_invalid',
        });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 Bad Request for oversized page size', async () => {
      const response = await request(app)
        .get('/api/v1/organizations?pageSize=500')
        .set('Authorization', `Bearer ${validToken}`);
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 Not Found for non-existent resources', async () => {
      vi.spyOn(organizationServiceModule.organizationService, 'getOrganizationById').mockRejectedValueOnce(
        new NotFoundError(`Organization with ID ${dummyOrgId} not found`),
      );

      const response = await request(app)
        .get(`/api/v1/organizations/${dummyOrgId}`)
        .set('Authorization', `Bearer ${validToken}`);
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});
