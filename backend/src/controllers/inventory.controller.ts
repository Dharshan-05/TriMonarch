import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';

export class InventoryController {
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

    policyEngine.assertCan(context, 'CREATE', 'INVENTORY');

    const inv = await inventoryService.createInventory(
      { ...req.body, organization_id: context.organizationId },
      context.userId,
      req.id,
    );
    const response: ApiResponse<typeof inv> = {
      success: true,
      data: inv,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const inv = await inventoryService.getInventoryById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'INVENTORY', inv);

    const response: ApiResponse<typeof inv> = {
      success: true,
      data: inv,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'LIST', 'INVENTORY');

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    const result = await inventoryService.listInventoryByOrganization(context.organizationId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
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
    const inv = await inventoryService.getInventoryById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'INVENTORY', inv);

    const updated = await inventoryService.updateInventory(
      context.organizationId,
      req.params.id!,
      req.body,
      context.userId,
      req.id,
    );
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  adjust = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const inv = await inventoryService.getInventoryById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'INVENTORY', inv);

    const adjusted = await inventoryService.adjustStockById(
      context.organizationId,
      req.params.id!,
      req.body,
      context.userId,
      req.id,
    );
    const response: ApiResponse<typeof adjusted> = {
      success: true,
      data: adjusted,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const inv = await inventoryService.getInventoryById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'DELETE', 'INVENTORY', inv);

    await inventoryService.deleteInventory(context.organizationId, req.params.id!, context.userId, req.id);
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Inventory record successfully deleted' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  getMovements = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const inv = await inventoryService.getInventoryById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'INVENTORY', inv);

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    const result = await inventoryService.getMovements(context.organizationId, req.params.id!, {
      page,
      pageSize,
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
}

export const inventoryController = new InventoryController();
