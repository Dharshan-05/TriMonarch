import { Request, Response } from 'express';
import { bomService } from '../services/bom.service';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';

export class BomController {
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

  createBom = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'CREATE', 'BOM');

    const bom = await bomService.createBom(
      {
        ...req.body,
        organization_id: context.organizationId,
      },
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof bom> = {
      success: true,
      data: bom,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  });

  getBom = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const bom = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'BOM', bom);

    const response: ApiResponse<typeof bom> = {
      success: true,
      data: bom,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  listBoms = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'LIST', 'BOM');

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize
      ? parseInt(req.query.pageSize as string, 10)
      : req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 20;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
    const queryStr = (req.query.search || req.query.query) as string | undefined;
    const productId = (req.query.productId || req.query.product_id) as string | undefined;
    const status = req.query.status as string | undefined;
    const isDefault = req.query.is_default !== undefined ? req.query.is_default === 'true' : undefined;

    const result = await bomService.listBoms(context.organizationId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query: queryStr,
      productId,
      status,
      is_default: isDefault,
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
  });

  updateBom = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'BOM', existing);

    const bom = await bomService.updateBom(
      context.organizationId,
      req.params.id!,
      req.body,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof bom> = {
      success: true,
      data: bom,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  deleteBom = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'DELETE', 'BOM', existing);

    await bomService.deleteBom(context.organizationId, req.params.id!, context.userId, req.id);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'BOM successfully deleted' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  addComponent = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const bom = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'BOM', bom);

    const component = await bomService.addComponent(
      context.organizationId,
      req.params.id!,
      req.body,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof component> = {
      success: true,
      data: component,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  });

  updateComponent = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const bom = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'BOM', bom);

    const component = await bomService.updateComponent(
      context.organizationId,
      req.params.id!,
      req.params.componentId!,
      req.body,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof component> = {
      success: true,
      data: component,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  removeComponent = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const bom = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'BOM', bom);

    await bomService.removeComponent(
      context.organizationId,
      req.params.id!,
      req.params.componentId!,
      context.userId,
      req.id,
    );

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'BOM component removed successfully' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  activateBom = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'MANAGE', 'BOM', existing);

    const bom = await bomService.activateBom(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof bom> = {
      success: true,
      data: bom,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  deactivateBom = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'MANAGE', 'BOM', existing);

    const bom = await bomService.deactivateBom(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof bom> = {
      success: true,
      data: bom,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  archiveBom = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'MANAGE', 'BOM', existing);

    const bom = await bomService.archiveBom(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof bom> = {
      success: true,
      data: bom,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  createRevision = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'MANAGE', 'BOM', existing);

    const newBom = await bomService.createRevision(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof newBom> = {
      success: true,
      data: newBom,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  });

  setDefaultBom = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await bomService.getBom(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'MANAGE', 'BOM', existing);

    const bom = await bomService.setDefaultBom(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof bom> = {
      success: true,
      data: bom,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  getProductBoms = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'READ', 'BOM');

    const boms = await bomService.getProductBoms(context.organizationId, req.params.productId!);

    const response: ApiResponse<typeof boms> = {
      success: true,
      data: boms,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });
}

export const bomController = new BomController();
