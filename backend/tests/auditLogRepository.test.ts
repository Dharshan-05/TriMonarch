import { describe, it, expect, vi } from 'vitest';
import { auditLogRepository } from '../src/repositories/auditLog.repository';
import { pool } from '../src/config/database';
import { withTransaction } from '../src/db/transaction';
import { sanitizeSortColumn } from '../src/repositories/base/repository.utils';
import { ValidationError } from '../src/types';
import { PoolClient } from 'pg';

describe('Audit Log Repository Subsystem (Phase 018)', () => {
  const orgAId = '11111111-1111-1111-1111-111111111111';
  const orgBId = '22222222-2222-2222-2222-222222222222';
  const userAId = '33333333-3333-3333-3333-333333333333';
  const auditId = 'audit-1111';
  const requestId = 'req-audit-999';

  const mockAuditLog = {
    id: auditId,
    organization_id: orgAId,
    user_id: userAId,
    action: 'CREATE' as const,
    entity_type: 'PRODUCT' as const,
    entity_id: 'prod-100',
    request_id: requestId,
    success: true,
    metadata: {
      sku: 'PROD-001',
      price: '199.9900',
      password: '[REDACTED]',
    },
    created_at: new Date(),
  };

  const mockQueryFn = async (sql: string, params?: unknown[]) => {
    if (sql.includes('INSERT INTO audit_logs')) {
      const metadataStr = (params && params.length ? params[params.length - 1] : '{}') as string;
      const parsedMetadata = JSON.parse(metadataStr);
      return {
        rows: [
          {
            ...mockAuditLog,
            metadata: parsedMetadata,
          },
        ],
        rowCount: 1,
        command: '',
        oid: 0,
        fields: [],
      };
    }
    if (sql.includes('SELECT') && sql.includes('FROM audit_logs WHERE id = $1 AND organization_id = $2')) {
      const [id, orgId] = params as [string, string];
      if (id === auditId && orgId === orgAId) {
        return { rows: [mockAuditLog], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('SELECT') && sql.includes('FROM audit_logs WHERE request_id = $1 AND organization_id = $2')) {
      const [reqId, orgId] = params as [string, string];
      if (reqId === requestId && orgId === orgAId) {
        return { rows: [mockAuditLog], rowCount: 1, command: '', oid: 0, fields: [] };
      }
      return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('COUNT(*) as count FROM audit_logs')) {
      return { rows: [{ count: '1' }], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    if (sql.includes('FROM audit_logs')) {
      return { rows: [mockAuditLog], rowCount: 1, command: '', oid: 0, fields: [] };
    }
    return { rows: [], rowCount: 0, command: '', oid: 0, fields: [] };
  };

  const createMockClient = () => {
    const mockClientQuery = vi.fn().mockImplementation(mockQueryFn);
    return {
      query: mockClientQuery,
      release: vi.fn(),
    } as unknown as PoolClient;
  };

  describe('Audit Log Immutability Enforcement', () => {
    it('should throw Error when update() is invoked on AuditLogRepository', async () => {
      await expect((auditLogRepository as unknown as { update: () => Promise<unknown> }).update()).rejects.toThrow(
        'Audit records are immutable and cannot be updated',
      );
    });

    it('should throw Error when delete() is invoked on AuditLogRepository', async () => {
      await expect(auditLogRepository.delete(orgAId, auditId)).rejects.toThrow(
        'Audit records are immutable and cannot be deleted',
      );
    });
  });

  describe('Audit Log Creation & Sensitive Data Redaction', () => {
    it('should create audit log record automatically redacting sensitive metadata fields', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const entry = await auditLogRepository.create({
        organization_id: orgAId,
        user_id: userAId,
        action: 'CREATE',
        entity_type: 'PRODUCT',
        entity_id: 'prod-100',
        request_id: requestId,
        success: true,
        metadata: {
          sku: 'PROD-001',
          price: '199.9900',
          password: 'SecretUserPassword123!',
          accessToken: 'jwt_token_secret',
        },
      });

      expect(entry.id).toBe(auditId);
      expect(entry.metadata.sku).toBe('PROD-001');
      expect(entry.metadata.password).toBe('[REDACTED]');
      expect(entry.metadata.accessToken).toBe('[REDACTED]');
    });
  });

  describe('Audit Log Lookups & Tenant Isolation', () => {
    it('should find audit log by ID with strict tenant isolation', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const log = await auditLogRepository.findById(orgAId, auditId);
      expect(log).not.toBeNull();
      expect(log?.id).toBe(auditId);

      const crossTenant = await auditLogRepository.findById(orgBId, auditId);
      expect(crossTenant).toBeNull();
    });

    it('should query audit logs by user, entity, action, request_id, and date range', async () => {
      vi.spyOn(pool, 'query').mockImplementation(mockQueryFn as unknown as typeof pool.query);

      const byUser = await auditLogRepository.listByUser(orgAId, userAId);
      expect(byUser.items.length).toBe(1);

      const byEntity = await auditLogRepository.listByEntity(orgAId, 'PRODUCT', 'prod-100');
      expect(byEntity.items.length).toBe(1);

      const byAction = await auditLogRepository.listByAction(orgAId, 'CREATE');
      expect(byAction.items.length).toBe(1);

      const byReq = await auditLogRepository.listByRequestId(orgAId, requestId);
      expect(byReq.length).toBe(1);

      const byDate = await auditLogRepository.listByDateRange(orgAId, '2026-01-01', '2026-12-31');
      expect(byDate.items.length).toBe(1);
    });
  });

  describe('Transaction Propagation & Security', () => {
    it('should propagate supplied PoolClient inside withTransaction for atomic audit log creation', async () => {
      const mockClient = createMockClient();
      vi.spyOn(pool, 'connect').mockResolvedValueOnce(mockClient);

      await withTransaction(async (txClient) => {
        expect(txClient).toBe(mockClient);
        await auditLogRepository.create(
          {
            organization_id: orgAId,
            user_id: userAId,
            action: 'LOGIN',
            entity_type: 'AUTHENTICATION',
          },
          txClient,
        );
      });

      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should reject malicious sort parameter input via sort allowlist', () => {
      expect(() =>
        sanitizeSortColumn('created_at; DROP TABLE audit_logs', [
          'created_at',
          'action',
          'entity_type',
          'user_id',
        ]),
      ).toThrow(ValidationError);

      expect(() =>
        sanitizeSortColumn('request_id DESC, DROP TABLE users', [
          'created_at',
          'action',
          'entity_type',
        ]),
      ).toThrow(ValidationError);
    });
  });
});
