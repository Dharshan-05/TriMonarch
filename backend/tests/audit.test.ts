import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { redactSensitiveData, computeDiff } from '../src/audit/audit.utils';
import { auditRepository } from '../src/audit/audit.repository';
import { auditService } from '../src/audit/audit.service';
import { productService } from '../src/services/product.service';
import { productRepository } from '../src/repositories/product.repository';
import { signAccessToken } from '../src/utils/jwt';
import { pool } from '../src/config/database';
import { DatabaseError } from '../src/db/errors';
import { PoolClient } from 'pg';

describe('Audit Logging & Activity Tracking Subsystem', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const tokenA = signAccessToken(userAId, orgAId).accessToken;

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

  describe('Sensitive Data Redaction & Diff Utilities', () => {
    it('should recursively redact sensitive fields while preserving non-sensitive data', () => {
      const input = {
        email: 'user@example.com',
        password: 'SuperSecretPassword!',
        password_hash: '$2b$10$hashvalue',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
        nested: {
          apiKey: 'key_12345',
          safeField: 'Hello World',
        },
      };

      const redacted = redactSensitiveData(input) as typeof input;

      expect(redacted.email).toBe('user@example.com');
      expect(redacted.password).toBe('[REDACTED]');
      expect(redacted.password_hash).toBe('[REDACTED]');
      expect(redacted.accessToken).toBe('[REDACTED]');
      expect(redacted.nested.apiKey).toBe('[REDACTED]');
      expect(redacted.nested.safeField).toBe('Hello World');
    });

    it('should compute changed-field diffs for UPDATE operations correctly', () => {
      const before = {
        name: 'Widget Alpha',
        category: 'Electronics',
        status: 'active',
        password: 'old_password',
      };
      const after = {
        name: 'Widget Alpha Pro',
        category: 'Electronics',
        status: 'inactive',
        password: 'new_password',
      };

      const diff = computeDiff(before, after);

      expect(diff.name).toEqual({ before: 'Widget Alpha', after: 'Widget Alpha Pro' });
      expect(diff.status).toEqual({ before: 'active', after: 'inactive' });
      expect(diff.category).toBeUndefined(); // Unchanged
      expect(diff.password?.before).toBe('[REDACTED]');
    });
  });

  describe('Audit Repository & Service Unit Tests', () => {
    it('should record audit event with sanitized metadata', async () => {
      const mockAudit = {
        id: 'audit-1',
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE' as const,
        entity_type: 'PRODUCT' as const,
        entity_id: 'prod-1',
        request_id: 'req-100',
        success: true,
        metadata: { name: 'Test Product', password: '[REDACTED]' },
        created_at: new Date(),
      };

      vi.spyOn(auditRepository, 'create').mockResolvedValueOnce(mockAudit);

      const result = await auditService.recordAuditEvent({
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'PRODUCT',
        entity_id: 'prod-1',
        request_id: 'req-100',
        metadata: { name: 'Test Product', password: 'SecretPassword' },
      });

      expect(result.id).toBe('audit-1');
      expect(result.metadata.password).toBe('[REDACTED]');
    });

    it('should list organization-scoped audit logs with pagination and filters', async () => {
      const mockPaginated = {
        items: [
          {
            id: 'audit-1',
            organization_id: orgAId,
            user_id: userAId,
            action: 'LOGIN' as const,
            entity_type: 'AUTHENTICATION' as const,
            entity_id: null,
            request_id: 'req-1',
            success: true,
            metadata: {},
            created_at: new Date(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.spyOn(auditRepository, 'listByOrganization').mockResolvedValueOnce(mockPaginated);

      const res = await auditService.listAuditLogsByOrganization(orgAId, { action: 'LOGIN' });

      expect(res.items.length).toBe(1);
      expect(res.items[0]!.action).toBe('LOGIN');
      expect(auditRepository.listByOrganization).toHaveBeenCalledWith(orgAId, { action: 'LOGIN' }, undefined);
    });
  });

  describe('Transactional Audit Consistency (Category A Audit)', () => {
    it('should rollback business operation if audit creation fails inside transaction', async () => {
      const mockClient = createMockPoolClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      const createdProd = {
        id: 'prod-atomic-1',
        organization_id: orgAId,
        sku: 'SKU-ATOMIC',
        name: 'Atomic Product',
        description: null,
        category: null,
        unit: 'pcs',
        status: 'active' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      vi.spyOn(productRepository, 'create').mockResolvedValueOnce(createdProd);
      vi.spyOn(auditService, 'recordAuditEvent').mockRejectedValueOnce(
        new DatabaseError('Audit table lock exception'),
      );

      await expect(
        productService.createProduct(
          { organization_id: orgAId, sku: 'SKU-ATOMIC', name: 'Atomic Product' },
          userAId,
          'req-atomic',
        ),
      ).rejects.toThrow();

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multi-Tenant Audit Isolation', () => {
    it('GET /api/v1/audit should enforce authenticated organization context', async () => {
      const mockAuditList = {
        items: [],
        total: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      };

      vi.spyOn(auditService, 'listAuditLogsByOrganization').mockResolvedValueOnce(mockAuditList);

      const response = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(response.status).toBe(200);
      expect(auditService.listAuditLogsByOrganization).toHaveBeenCalledWith(orgAId, expect.anything());
    });

    it('GET /api/v1/audit should reject cross-organization override attempts', async () => {
      const response = await request(app)
        .get('/api/v1/audit')
        .set('Authorization', `Bearer ${tokenA}`)
        .set('x-organization-id', orgBId);

      expect(response.status).toBe(400);
      expect(response.body.error.message).toContain('Cross-organization access denied');
    });
  });

  describe('Audit Immutability Security Audit', () => {
    it('should NOT expose modification or deletion endpoints on /api/v1/audit', async () => {
      const deleteRes = await request(app)
        .delete('/api/v1/audit/audit-123')
        .set('Authorization', `Bearer ${tokenA}`);
      expect(deleteRes.status).toBe(404);

      const putRes = await request(app)
        .put('/api/v1/audit/audit-123')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ action: 'MALICIOUS_OVERWRITE' });
      expect(putRes.status).toBe(404);
    });
  });
});
