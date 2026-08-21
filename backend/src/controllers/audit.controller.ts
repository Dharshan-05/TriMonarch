import { Request, Response } from 'express';
import { auditService } from '../audit/audit.service';
import { AuditEntityType } from '../audit/audit.types';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';
import { NotFoundError, ValidationError, AuditLogImmutableError } from '../types';
import {
  listAuditQuerySchema,
  auditIdParamsSchema,
  entityAuditParamsSchema,
  resourceAuditParamsSchema,
  actorAuditParamsSchema,
  auditExportQuerySchema,
} from '../schemas/audit.schema';

export class AuditController {
  private getPolicyContext(req: Request): PolicyContext {
    if (!req.auth) {
      throw new AuthenticationError();
    }
    const organizationId = getOrganizationId(req);
    return {
      userId: req.auth.userId,
      organizationId,
      roles: req.auth.roles || ['EMPLOYEE'],
    };
  }

  listAuditLogs = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    policyEngine.assertCan(context, 'LIST', 'AUDIT');

    const queryResult = listAuditQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const filters = queryResult.data;
    const page = Math.max(1, filters.page || 1);
    const rawLimit = filters.pageSize || filters.limit || 50;
    const pageSize = Math.min(100, Math.max(1, rawLimit));

    const result = await auditService.listAuditLogsByOrganization(context.organizationId, {
      ...filters,
      page,
      pageSize,
      sortOrder: filters.sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc',
    });

    const response: ApiPaginatedResponse<(typeof result.items)[0]> = {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        requestId: req.id,
      },
    };
    res.status(200).json(response);
  };

  getAuditLogById = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);

    const paramsResult = auditIdParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const auditLog = await auditService.getAuditLogById(context.organizationId, paramsResult.data.id);
    if (!auditLog) {
      throw new NotFoundError(`Audit log with ID ${paramsResult.data.id} not found`);
    }

    policyEngine.assertCan(context, 'READ', 'AUDIT', auditLog);

    const response: ApiResponse<typeof auditLog> = {
      success: true,
      data: auditLog,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  getAvailableEvents = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    policyEngine.assertCan(context, 'READ', 'AUDIT');

    const events = await auditService.getAvailableEventTypes();

    const response: ApiResponse<{ events: string[] }> = {
      success: true,
      data: { events },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  getStats = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    policyEngine.assertCan(context, 'READ', 'AUDIT');

    const dateFrom = (req.query.dateFrom || req.query.startDate) as string | undefined;
    const dateTo = (req.query.dateTo || req.query.endDate) as string | undefined;

    const stats = await auditService.getStats(context.organizationId, dateFrom, dateTo);

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  exportAuditLogs = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    policyEngine.assertCan(context, 'EXPORT', 'AUDIT');

    const queryResult = auditExportQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(
        queryResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const filters = queryResult.data;
    const sortOrder = filters.sortOrder?.toLowerCase() === 'desc' ? 'desc' : filters.sortOrder?.toLowerCase() === 'asc' ? 'asc' : undefined;

    const records = await auditService.exportAuditLogs(
      context.organizationId,
      {
        ...filters,
        sortOrder,
        pageSize: filters.maxRecords,
      },
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof records> = {
      success: true,
      data: records,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  getActorAuditHistory = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    policyEngine.assertCan(context, 'READ', 'AUDIT');

    const paramsResult = actorAuditParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const userId = paramsResult.data.userId || paramsResult.data.actorId;
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    const queryResult = listAuditQuerySchema.safeParse(req.query);
    const page = Math.max(1, queryResult.success ? queryResult.data.page || 1 : 1);
    const rawLimit = queryResult.success ? queryResult.data.pageSize || queryResult.data.limit || 50 : 50;
    const pageSize = Math.min(100, Math.max(1, rawLimit));

    const result = await auditService.getActorAuditHistory(
      context.organizationId,
      userId,
      { page, pageSize },
    );

    const response: ApiPaginatedResponse<(typeof result.items)[0]> = {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        requestId: req.id,
      },
    };
    res.status(200).json(response);
  };

  getResourceAuditHistory = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    policyEngine.assertCan(context, 'READ', 'AUDIT');

    const paramsResult = resourceAuditParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    // Map plural resource names to entity_type enum if needed
    let entityType = paramsResult.data.resource.toUpperCase();
    if (entityType.endsWith('S')) {
      const singular = entityType.slice(0, -1);
      if (['PRODUCT', 'USER', 'ROLE', 'EMPLOYEE', 'CUSTOMER', 'SUPPLIER', 'BOM'].includes(singular)) {
        entityType = singular;
      }
    }

    const queryResult = listAuditQuerySchema.safeParse(req.query);
    const page = Math.max(1, queryResult.success ? queryResult.data.page || 1 : 1);
    const rawLimit = queryResult.success ? queryResult.data.pageSize || queryResult.data.limit || 50 : 50;
    const pageSize = Math.min(100, Math.max(1, rawLimit));

    const result = await auditService.getEntityAuditHistory(
      context.organizationId,
      entityType as AuditEntityType,
      paramsResult.data.resourceId,
      { page, pageSize },
    );

    const response: ApiPaginatedResponse<(typeof result.items)[0]> = {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        requestId: req.id,
      },
    };
    res.status(200).json(response);
  };

  getEntityAuditHistory = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    policyEngine.assertCan(context, 'READ', 'AUDIT');

    const paramsResult = entityAuditParamsSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(
        paramsResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      );
    }

    const queryResult = listAuditQuerySchema.safeParse(req.query);
    const page = Math.max(1, queryResult.success ? queryResult.data.page || 1 : 1);
    const rawLimit = queryResult.success ? queryResult.data.pageSize || queryResult.data.limit || 50 : 50;
    const pageSize = Math.min(100, Math.max(1, rawLimit));

    const result = await auditService.getEntityAuditHistory(
      context.organizationId,
      paramsResult.data.entityType as AuditEntityType,
      paramsResult.data.entityId,
      { page, pageSize },
    );

    const response: ApiPaginatedResponse<(typeof result.items)[0]> = {
      success: true,
      data: result.items,
      meta: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
        requestId: req.id,
      },
    };
    res.status(200).json(response);
  };

  rejectMutation = async (_req: Request, _res: Response): Promise<void> => {
    throw new AuditLogImmutableError();
  };
}

export const auditController = new AuditController();
