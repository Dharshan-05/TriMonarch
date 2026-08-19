import { PoolClient } from 'pg';
import { auditRepository } from './audit.repository';
import { CreateAuditInput, AuditLog, AuditFilterParams } from './audit.types';
import { redactSensitiveData } from './audit.utils';
import { PaginatedResult, PaginationParams } from '../repositories/base/pagination';
import { logger } from '../utils/logger';

export class AuditService {
  async recordAuditEvent(input: CreateAuditInput, client?: PoolClient): Promise<AuditLog | null> {
    try {
      const sanitizedInput: CreateAuditInput = {
        ...input,
        metadata: (redactSensitiveData(input.metadata || {}) || {}) as Record<string, unknown>,
      };

      return await auditRepository.create(sanitizedInput, client);
    } catch (error) {
      if (client) {
        throw error;
      }
      logger.warn({ error, action: input.action }, 'Audit log recording skipped due to error');
      return null;
    }
  }

  async getAuditLogById(organizationId: string, id: string): Promise<AuditLog | null> {
    return auditRepository.findById(organizationId, id);
  }

  async listAuditLogsByOrganization(
    organizationId: string,
    params?: AuditFilterParams & PaginationParams,
  ): Promise<PaginatedResult<AuditLog>> {
    return auditRepository.listByOrganization(organizationId, params);
  }
}

export const auditService = new AuditService();
