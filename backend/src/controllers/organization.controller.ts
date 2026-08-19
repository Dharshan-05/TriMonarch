import { Request, Response } from 'express';
import { organizationService } from '../services/organization.service';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';

export class OrganizationController {
  create = async (req: Request, res: Response): Promise<void> => {
    const org = await organizationService.createOrganization(req.body);
    const response: ApiResponse<typeof org> = {
      success: true,
      data: org,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const org = await organizationService.getOrganizationById(req.params.id!);
    const response: ApiResponse<typeof org> = {
      success: true,
      data: org,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

    const result = await organizationService.listOrganizations({ page, pageSize, sortBy, sortOrder });

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
    const updated = await organizationService.updateOrganization(req.params.id!, req.body);
    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await organizationService.deleteOrganization(req.params.id!);
    res.status(204).send();
  };
}

export const organizationController = new OrganizationController();
