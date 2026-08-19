import { Request, Response } from 'express';
import { inventoryService } from '../services/inventory.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';

export class InventoryController {
  getById = async (req: Request, res: Response): Promise<void> => {
    const orgId = getOrganizationId(req);
    const inv = await inventoryService.getInventoryById(orgId, req.params.id!);
    const response: ApiResponse<typeof inv> = {
      success: true,
      data: inv,
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

    const result = await inventoryService.listInventoryByOrganization(orgId, {
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
    const orgId = getOrganizationId(req);
    const updated = await inventoryService.updateInventory(orgId, req.params.id!, req.body);
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const inventoryController = new InventoryController();
