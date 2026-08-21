import { PoolClient } from 'pg';
import { auditRepository } from './audit.repository';
import { CreateAuditInput, AuditLog, AuditFilterParams, AuditCategory, AuditEntityType } from './audit.types';
import { redactSensitiveData } from './audit.utils';
import { PaginatedResult, PaginationParams } from '../repositories/base/pagination';
import { logger } from '../utils/logger';

export class AuditService {
  private deriveDefaultCategory(input: CreateAuditInput): AuditCategory {
    if (input.category) {
      return input.category;
    }

    if (
      ['LOGIN', 'LOGOUT', 'AUTH_FAILURE', 'ACCESS_DENIED', 'ROLE_ASSIGN', 'ROLE_REMOVE', 'CREATE', 'DELETE'].includes(
        input.action,
      )
    ) {
      return 'CATEGORY_A';
    }

    if (input.action === 'READ') {
      return 'CATEGORY_C';
    }

    if (input.action === 'UPDATE') {
      return 'CATEGORY_B';
    }

    return 'CATEGORY_A';
  }

  async recordAuditEvent(input: CreateAuditInput, client?: PoolClient): Promise<AuditLog | null> {
    const category = this.deriveDefaultCategory(input);

    const sanitizedInput: CreateAuditInput = {
      ...input,
      user_id: input.user_id || input.actor_id || null,
      category,
      metadata: (redactSensitiveData(input.metadata || {}) || {}) as Record<string, unknown>,
      before_snapshot: input.before_snapshot || input.before
        ? ((redactSensitiveData(input.before_snapshot || input.before) || {}) as Record<string, unknown>)
        : undefined,
      after_snapshot: input.after_snapshot || input.after
        ? ((redactSensitiveData(input.after_snapshot || input.after) || {}) as Record<string, unknown>)
        : undefined,
    };

    try {
      return await auditRepository.create(sanitizedInput, client);
    } catch (error) {
      if (client) {
        throw error;
      }
      logger.warn({ error, action: input.action }, 'Audit log recording skipped due to error');
      return null;
    }
  }

  async getAuditLogById(organizationId: string, id: string, client?: PoolClient): Promise<AuditLog | null> {
    return auditRepository.findById(organizationId, id, client);
  }

  async listAuditLogsByOrganization(
    organizationId: string,
    params?: AuditFilterParams & PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return auditRepository.listByOrganization(organizationId, params, client);
  }

  async getEntityAuditHistory(
    organizationId: string,
    entityType: AuditEntityType,
    entityId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return auditRepository.listByEntity(organizationId, entityType, entityId, params, client);
  }

  async getActorAuditHistory(
    organizationId: string,
    actorId: string,
    params?: PaginationParams,
    client?: PoolClient,
  ): Promise<PaginatedResult<AuditLog>> {
    return auditRepository.listByActor(organizationId, actorId, params, client);
  }

  async getAvailableEventTypes(): Promise<string[]> {
    const { BUSINESS_EVENT_REGISTRY } = await import('../events/businessEvent.registry');
    return Object.keys(BUSINESS_EVENT_REGISTRY);
  }

  async getStats(
    organizationId: string,
    dateFrom?: string,
    dateTo?: string,
    client?: PoolClient,
  ) {
    return auditRepository.getStats(organizationId, dateFrom, dateTo, client);
  }

  async exportAuditLogs(
    organizationId: string,
    filters?: AuditFilterParams & PaginationParams,
    userId?: string,
    requestId?: string,
  ): Promise<AuditLog[]> {
    const maxRecords = Math.min(10000, filters?.pageSize || 1000);
    const result = await auditRepository.listByOrganization(
      organizationId,
      { ...filters, page: 1, pageSize: maxRecords },
    );

    const { businessEventService } = await import('../services/businessEvent.service');
    await businessEventService.emit({
      eventName: 'AUDIT_EXPORTED',
      organization_id: organizationId,
      user_id: userId,
      request_id: requestId,
      metadata: { record_count: result.items.length, filters: filters || {} },
    });

    return result.items;
  }
}

export const auditService = new AuditService();
