import { Request, Response } from 'express';
import { partnerService } from '../services/partner.service';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';

export class PartnerController {
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
    const type = req.body.type === 'supplier' ? 'supplier' : 'customer';

    policyEngine.assertCan(context, 'CREATE', 'PARTNER');

    const result =
      type === 'supplier'
        ? await partnerService.createSupplier({ ...req.body, organization_id: orgId }, context.userId, req.id)
        : await partnerService.createCustomer({ ...req.body, organization_id: orgId }, context.userId, req.id);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const type = req.query.type === 'supplier' ? 'supplier' : 'customer';

    const partner =
      type === 'supplier'
        ? await partnerService.getSupplierById(context.organizationId, req.params.id!)
        : await partnerService.getCustomerById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'PARTNER', partner);

    const response: ApiResponse<typeof partner> = {
      success: true,
      data: partner,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'LIST', 'PARTNER');

    const type = req.query.type as string | undefined;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';
    const search = (req.query.search as string) || (req.query.query as string);
    const status = req.query.status as string | undefined;

    const result =
      type === 'supplier'
        ? await partnerService.listSuppliers(context.organizationId, {
            page,
            pageSize,
            sortBy,
            sortOrder,
            query: search,
            status,
          })
        : await partnerService.listCustomers(context.organizationId, {
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
    const type = req.body.type === 'supplier' || req.query.type === 'supplier' ? 'supplier' : 'customer';

    const existing =
      type === 'supplier'
        ? await partnerService.getSupplierById(context.organizationId, req.params.id!)
        : await partnerService.getCustomerById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PARTNER', existing);

    const updated =
      type === 'supplier'
        ? await partnerService.updateSupplier(context.organizationId, req.params.id!, req.body, context.userId, req.id)
        : await partnerService.updateCustomer(context.organizationId, req.params.id!, req.body, context.userId, req.id);

    const response: ApiResponse<typeof updated> = {
      success: true,
      data: updated,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const type = req.query.type === 'supplier' ? 'supplier' : 'customer';

    const existing =
      type === 'supplier'
        ? await partnerService.getSupplierById(context.organizationId, req.params.id!)
        : await partnerService.getCustomerById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'DELETE', 'PARTNER', existing);

    if (type === 'supplier') {
      await partnerService.deleteSupplier(context.organizationId, req.params.id!, context.userId, req.id);
    } else {
      await partnerService.deleteCustomer(context.organizationId, req.params.id!, context.userId, req.id);
    }

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Partner successfully deleted' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const partnerController = new PartnerController();
