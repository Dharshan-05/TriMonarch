import { PoolClient } from 'pg';
import { query, queryOne } from '../db/query';
import { AuditLog, CreateAuditInput, AuditFilterParams } from './audit.types';
import { redactSensitiveData } from './audit.utils';
import { BaseRepository } from '../repositories/base/base.repository';
import { PaginatedResult, PaginationParams } from '../repositories/base/pagination';

export class AuditLogRepository extends BaseRepository<
  AuditLog,
  CreateAuditInput,
  never,
  AuditFilterParams
> {
  protected readonly tableName = 'audit_logs';
  protected readonly allowedSortFields = [
    'created_at',
    'action',
    'entity_type',
    'entity_id',
    'user_id',
    'request_id',
    'success',
  ];
  protected readonly defaultSortBy = 'created_at';
  protected readonly isOrganizationScoped = true;

  // Immutability Guard: Override update and delete to prevent historical audit mutation
  async update(): Promise<never> {
    throw new Error('Audit records are immutable and cannot be updated');
  }

  override async delete(): Promise<never> {
    throw new Error('Audit records are immutable and cannot be deleted');
  }

  async create(data: CreateAuditInput, client?: PoolClient): Promise<AuditLog> {
    const redactedMetadata = redactSensitiveData(data.metadata || {}) as Record<string, unknown>;

    const rows = await query<AuditLog>(
      `INSERT INTO audit_logs (organization_id, user_id, action, entity_type, entity_id, request_id, success, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *;`,
      [
        data.organization_id,
        data.user_id || null,
        data.action,
        data.entity_type,
        data.entity_id || null,
        data.request_id || null,
        data.success ?? true,
        JSON.stringify(redactedMetadata),
      ],
      client,
    );

    return rows[0]!;
  }

  async findById(organizationId: string, id: string, client?: PoolClient): Promise<AuditLog | null> {
    return queryOne<AuditLog>(
      'SELECT * FROM audit_logs WHERE id = $1 AND organization_id = $2;',
      [id, organizationId],
      client,
    );
  }

  protected override buildFilterConditions(
    organizationId: string,
    params?: AuditFilterParams,
  ): { conditions: string[]; values: unknown[] } {
    const conditions: string[] = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (params?.action) {
      conditions.push(`action = $${idx++}`);
      values.push(params.action);
    }
    if (params?.entity_type) {
      conditions.push(`entity_type = $${idx++}`);
      values.push(params.entity_type);
    }
    if (params?.entity_id) {
      conditions.push(`entity_id = $${idx++}`);
      values.push(params.entity_id);
    }
    if (params?.user_id) {
      conditions.push(`user_id = $${idx++}`);
      values.push(params.user_id);
    }
    if (params?.request_id) {
      conditions.push(`request_id = $${idx++}`);
      values.push(params.request_id);
    }
    if (params?.success !== undefined) {
      conditions.push(`success = $${idx++}`);
      values.push(params.success);
    }
    if (params?.startDate) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(params.startDate);
    }
    if (params?.endDate) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(params.endDate);
    }

    return { conditions, values };
  }

  // Specialized convenience query methods:

  async listByUser(
    organizationId: string,
    userId: string,
    params?: AuditFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.listByOrganization(organizationId, { ...params, user_id: userId }, client);
  }

  async listByEntity(
    organizationId: string,
    entityType: AuditFilterParams['entity_type'],
    entityId: string,
    params?: AuditFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.listByOrganization(
      organizationId,
      { ...params, entity_type: entityType, entity_id: entityId },
      client,
    );
  }

  async listByAction(
    organizationId: string,
    action: AuditFilterParams['action'],
    params?: AuditFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.listByOrganization(organizationId, { ...params, action }, client);
  }

  async listByRequestId(
    organizationId: string,
    requestId: string,
    client?: PoolClient,
  ): Promise<AuditLog[]> {
    return query<AuditLog>(
      'SELECT * FROM audit_logs WHERE request_id = $1 AND organization_id = $2 ORDER BY created_at ASC;',
      [requestId, organizationId],
      client,
    );
  }

  async listByDateRange(
    organizationId: string,
    dateFrom: Date | string,
    dateTo: Date | string,
    params?: AuditFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.listByOrganization(
      organizationId,
      { ...params, startDate: String(dateFrom), endDate: String(dateTo) },
      client,
    );
  }

  async search(
    organizationId: string,
    params?: AuditFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.listByOrganization(organizationId, params, client);
  }
}

export const auditLogRepository = new AuditLogRepository();
export const AuditRepository = AuditLogRepository;
export const auditRepository = auditLogRepository;
