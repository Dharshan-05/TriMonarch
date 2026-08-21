import { Request, Response } from 'express';
import { userService } from '../services/user.service';
import { authorizationService } from '../services/authorization.service';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';

export class UserController {
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

  create = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const orgId = context.organizationId;

    if (req.body.role) {
      context.requestedFields = ['role'];
    }

    policyEngine.assertCan(context, 'CREATE', 'USER');

    const user = await userService.createUser({ ...req.body, organization_id: orgId }, req.id);
    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const user = await userService.getUserById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'USER', user);

    const response: ApiResponse<typeof user> = {
      success: true,
      data: user,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'LIST', 'USER');

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const search = (req.query.search as string) || (req.query.query as string);
    const status = req.query.status as string | undefined;

    const result = await userService.listUsersByOrganization(context.organizationId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query: search,
      status,
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

  update = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const user = await userService.getUserById(context.organizationId, req.params.id!);

    context.requestedFields = Object.keys(req.body);
    policyEngine.assertCan(context, 'UPDATE', 'USER', user);

    const updated = await userService.updateUser(context.organizationId, req.params.id!, req.body, req.id);
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const user = await userService.getUserById(context.organizationId, req.params.id!);

    context.requestedFields = ['status'];
    policyEngine.assertCan(context, 'UPDATE', 'USER', user);

    const updated = await userService.updateUserStatus(context.organizationId, req.params.id!, req.body.status, req.id);
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  getRoles = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const user = await userService.getUserById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'USER', user);

    const roles = await authorizationService.getUserRoles(user.id);
    const response: ApiResponse<{ userId: string; roles: string[] }> = {
      success: true,
      data: { userId: user.id, roles },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const user = await userService.getUserById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'DELETE', 'USER', user);

    await userService.deleteUser(context.organizationId, req.params.id!, req.id);
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'User successfully deactivated' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const userController = new UserController();
