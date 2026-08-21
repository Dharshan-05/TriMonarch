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
    'category',
    'action',
    'entity_type',
    'entity_id',
    'user_id',
    'request_id',
    'correlation_id',
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
    const userId = data.user_id || data.actor_id || null;
    const category = data.category || 'CATEGORY_A';

    const redactedMetadata = redactSensitiveData(data.metadata || {}) as Record<string, unknown>;
    const redactedBefore = data.before_snapshot || data.before
      ? (redactSensitiveData(data.before_snapshot || data.before) as Record<string, unknown>)
      : null;
    const redactedAfter = data.after_snapshot || data.after
      ? (redactSensitiveData(data.after_snapshot || data.after) as Record<string, unknown>)
      : null;

    const rows = await query<AuditLog>(
      `INSERT INTO audit_logs (
         organization_id, user_id, category, action, entity_type, entity_id,
         request_id, correlation_id, reason, before_snapshot, after_snapshot,
         success, metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *;`,
      [
        data.organization_id,
        userId,
        category,
        data.action,
        data.entity_type,
        data.entity_id || null,
        data.request_id || null,
        data.correlation_id || null,
        data.reason || null,
        redactedBefore ? JSON.stringify(redactedBefore) : null,
        redactedAfter ? JSON.stringify(redactedAfter) : null,
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

    if (params?.category) {
      conditions.push(`category = $${idx++}`);
      values.push(params.category);
    }
    if (params?.action) {
      conditions.push(`action = $${idx++}`);
      values.push(params.action);
    }
    const entityType = params?.entity_type || params?.resource;
    if (entityType) {
      conditions.push(`UPPER(entity_type) = $${idx++}`);
      values.push(entityType.toUpperCase());
    }
    const entityId = params?.entity_id || params?.resourceId;
    if (entityId) {
      conditions.push(`entity_id = $${idx++}`);
      values.push(entityId);
    }

    const userId = params?.user_id || params?.actor_id || params?.actorUserId;
    if (userId) {
      conditions.push(`user_id = $${idx++}`);
      values.push(userId);
    }
    if (params?.request_id) {
      conditions.push(`request_id = $${idx++}`);
      values.push(params.request_id);
    }
    if (params?.correlation_id) {
      conditions.push(`correlation_id = $${idx++}`);
      values.push(params.correlation_id);
    }
    if (params?.success !== undefined) {
      conditions.push(`success = $${idx++}`);
      values.push(params.success);
    }
    const startDate = params?.startDate || params?.dateFrom;
    if (startDate) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(new Date(startDate));
    }
    const endDate = params?.endDate || params?.dateTo;
    if (endDate) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(new Date(endDate));
    }
    if (params?.search) {
      const searchLike = `%${params.search}%`;
      conditions.push(
        `(action ILIKE $${idx} OR entity_type ILIKE $${idx} OR reason ILIKE $${idx} OR metadata::text ILIKE $${idx})`,
      );
      values.push(searchLike);
      idx++;
    }

    return { conditions, values };
  }

  async getStats(
    organizationId: string,
    dateFrom?: string | Date,
    dateTo?: string | Date,
    client?: PoolClient,
  ) {
    const conditions = ['organization_id = $1'];
    const values: unknown[] = [organizationId];
    let idx = 2;

    if (dateFrom) {
      conditions.push(`created_at >= $${idx++}`);
      values.push(new Date(dateFrom));
    }
    if (dateTo) {
      conditions.push(`created_at <= $${idx++}`);
      values.push(new Date(dateTo));
    }

    const whereClause = conditions.join(' AND ');

    const totalRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM audit_logs WHERE ${whereClause};`,
      values,
      client,
    );
    const totalEvents = parseInt(totalRes[0]?.count || '0', 10);

    const actionRes = await query<{ action: string; count: string }>(
      `SELECT action, COUNT(*)::text as count FROM audit_logs WHERE ${whereClause} GROUP BY action ORDER BY count DESC LIMIT 20;`,
      values,
      client,
    );

    const resourceRes = await query<{ entity_type: string; count: string }>(
      `SELECT entity_type, COUNT(*)::text as count FROM audit_logs WHERE ${whereClause} GROUP BY entity_type ORDER BY count DESC LIMIT 20;`,
      values,
      client,
    );

    const userRes = await query<{ user_id: string; count: string }>(
      `SELECT user_id, COUNT(*)::text as count FROM audit_logs WHERE ${whereClause} AND user_id IS NOT NULL GROUP BY user_id ORDER BY count DESC LIMIT 20;`,
      values,
      client,
    );

    return {
      totalEvents,
      eventsByAction: actionRes.map((r) => ({ action: r.action, count: parseInt(r.count, 10) })),
      eventsByResource: resourceRes.map((r) => ({ resource: r.entity_type, count: parseInt(r.count, 10) })),
      eventsByUser: userRes.map((r) => ({ userId: r.user_id, count: parseInt(r.count, 10) })),
    };
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

  async listByActor(
    organizationId: string,
    actorId: string,
    params?: AuditFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return this.listByOrganization(organizationId, { ...params, actor_id: actorId }, client);
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
