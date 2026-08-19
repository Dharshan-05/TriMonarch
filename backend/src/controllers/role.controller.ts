import { Request, Response } from 'express';
import { roleService } from '../services/role.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';

export class RoleController {
  create = async (req: Request, res: Response): Promise<void> => {
    const orgId = req.body.organization_id || getOrganizationId(req);
    const role = await roleService.createRole({ ...req.body, organization_id: orgId });
    const response: ApiResponse<typeof role> = {
      success: true,
      data: role,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const orgId = getOrganizationId(req);
    const role = await roleService.getRoleById(orgId, req.params.id!);
    const response: ApiResponse<typeof role> = {
      success: true,
      data: role,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const orgId = getOrganizationId(req);
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    const result = await roleService.listRolesByOrganization(orgId, { page, pageSize, sortBy, sortOrder });

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

  update = async (req: Request, res: Response): Promise<void> => {
    const orgId = getOrganizationId(req);
    const updated = await roleService.updateRole(orgId, req.params.id!, req.body);
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  assignRoleToUser = async (req: Request, res: Response): Promise<void> => {
    const { userId, roleId } = req.params;
    await roleService.assignRoleToUser(userId!, roleId!);
    const response: ApiResponse<{ assigned: true }> = {
      success: true,
      data: { assigned: true },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  removeRoleFromUser = async (req: Request, res: Response): Promise<void> => {
    const { userId, roleId } = req.params;
    await roleService.removeRoleFromUser(userId!, roleId!);
    res.status(204).send();
  };

  listUserRoles = async (req: Request, res: Response): Promise<void> => {
    const roles = await roleService.listUserRoles(req.params.userId!);
    const response: ApiResponse<typeof roles> = {
      success: true,
      data: roles,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const roleController = new RoleController();
