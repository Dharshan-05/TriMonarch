import { Request, Response } from 'express';
import { supplierService } from '../services/supplier.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';

export class SupplierController {
  create = async (req: Request, res: Response): Promise<void> => {
    const orgId = req.body.organization_id || getOrganizationId(req);
    const supp = await supplierService.createSupplier({ ...req.body, organization_id: orgId });
    const response: ApiResponse<typeof supp> = {
      success: true,
      data: supp,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const orgId = getOrganizationId(req);
    const supp = await supplierService.getSupplierById(orgId, req.params.id!);
    const response: ApiResponse<typeof supp> = {
      success: true,
      data: supp,
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
    const query = (req.query.query as string | undefined) || (req.query.search as string | undefined);
    const status = req.query.status as string | undefined;

    const result = await supplierService.searchSuppliers(orgId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query,
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
    const orgId = getOrganizationId(req);
    const updated = await supplierService.updateSupplier(orgId, req.params.id!, req.body);
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const supplierController = new SupplierController();
