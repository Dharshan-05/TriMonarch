import { Request, Response } from 'express';
import { auditService } from '../audit/audit.service';
import { AuditAction, AuditEntityType } from '../audit/audit.types';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { NotFoundError } from '../types';

export class AuditController {
  listAuditLogs = async (req: Request, res: Response): Promise<void> => {
    const organizationId = getOrganizationId(req);
    const { action, entity_type, entity_id, user_id, request_id, startDate, endDate, page, pageSize, sortBy, sortOrder } = req.query;

    const parsedPage = page ? parseInt(page as string, 10) : 1;
    const parsedPageSize = pageSize ? parseInt(pageSize as string, 10) : 10;

    const result = await auditService.listAuditLogsByOrganization(organizationId, {
      action: action ? (action as AuditAction) : undefined,
      entity_type: entity_type ? (entity_type as AuditEntityType) : undefined,
      entity_id: entity_id ? (entity_id as string) : undefined,
      user_id: user_id ? (user_id as string) : undefined,
      request_id: request_id ? (request_id as string) : undefined,
      startDate: startDate ? (startDate as string) : undefined,
      endDate: endDate ? (endDate as string) : undefined,
      page: parsedPage,
      pageSize: parsedPageSize,
      sortBy: sortBy ? (sortBy as string) : undefined,
      sortOrder: sortOrder === 'desc' ? 'desc' : sortOrder === 'asc' ? 'asc' : undefined,
    });

    const response: ApiPaginatedResponse<typeof result.items[0]> = {
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
    const organizationId = getOrganizationId(req);
    const { id } = req.params;

    const auditLog = await auditService.getAuditLogById(organizationId, id!);
    if (!auditLog) {
      throw new NotFoundError(`Audit log with ID ${id} not found`);
    }

    const response: ApiResponse<typeof auditLog> = {
      success: true,
      data: auditLog,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const auditController = new AuditController();
