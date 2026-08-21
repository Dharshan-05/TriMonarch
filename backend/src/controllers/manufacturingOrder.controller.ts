import { Request, Response } from 'express';
import { manufacturingOrderService } from '../services/manufacturingOrder.service';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';

export class ManufacturingOrderController {
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

  createOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'CREATE', 'MANUFACTURING');

    const order = await manufacturingOrderService.createOrder(
      {
        ...req.body,
        organization_id: context.organizationId,
      },
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  });

  getOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const order = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'MANUFACTURING', order);

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  listOrders = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'LIST', 'MANUFACTURING');

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
    const bomId = (req.query.bomId || req.query.bom_id) as string | undefined;
    const warehouseId = (req.query.warehouseId || req.query.warehouse_id) as string | undefined;
    const status = req.query.status as string | undefined;
    const priority = req.query.priority as string | undefined;

    const result = await manufacturingOrderService.listOrders(context.organizationId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query: queryStr,
      productId,
      bomId,
      warehouseId,
      status,
      priority,
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

  updateOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'MANUFACTURING', existing);

    const order = await manufacturingOrderService.updateOrder(
      context.organizationId,
      req.params.id!,
      req.body,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  deleteOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'DELETE', 'MANUFACTURING', existing);

    await manufacturingOrderService.deleteOrder(context.organizationId, req.params.id!, context.userId, req.id);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Manufacturing order successfully deleted' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  getMaterials = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'MANUFACTURING', existing);

    const materials = await manufacturingOrderService.getMaterials(context.organizationId, req.params.id!);

    const response: ApiResponse<typeof materials> = {
      success: true,
      data: materials,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  materialCheck = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'MANUFACTURING', existing);

    const check = await manufacturingOrderService.materialCheck(context.organizationId, req.params.id!);

    const response: ApiResponse<typeof check> = {
      success: true,
      data: check,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  confirmOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'MANUFACTURING', existing);

    const order = await manufacturingOrderService.confirmOrder(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.body?.reason,
      req.id,
    );

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  planOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'MANUFACTURING', existing);

    const order = await manufacturingOrderService.planOrder(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.body?.reason,
      req.id,
    );

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  releaseOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'APPROVE', 'MANUFACTURING', existing);

    const order = await manufacturingOrderService.releaseOrder(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.body?.reason,
      req.id,
    );

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  startOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'EXECUTE', 'MANUFACTURING', existing);

    const order = await manufacturingOrderService.startOrder(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.body?.reason,
      req.id,
    );

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  cancelOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'APPROVE', 'MANUFACTURING', existing);

    const order = await manufacturingOrderService.cancelOrder(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.body?.reason,
      req.id,
    );

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  completeOrder = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const existing = await manufacturingOrderService.getOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'EXECUTE', 'MANUFACTURING', existing);

    const order = await manufacturingOrderService.completeOrder(
      context.organizationId,
      req.params.id!,
      context.userId,
      req.body?.reason,
      req.id,
    );

    const response: ApiResponse<typeof order> = {
      success: true,
      data: order,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  getOrderItems = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const items = await manufacturingOrderService.getOrderItems(context.organizationId, req.params.id!);

    const response: ApiResponse<typeof items> = {
      success: true,
      data: items,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  getStatusHistory = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const history = await manufacturingOrderService.getStatusHistory(context.organizationId, req.params.id!);

    const response: ApiResponse<typeof history> = {
      success: true,
      data: history,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  getOrdersByProduct = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const orders = await manufacturingOrderService.getOrdersByProduct(context.organizationId, req.params.productId!);

    const response: ApiResponse<typeof orders> = {
      success: true,
      data: orders,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });

  getOrdersByWarehouse = asyncHandler(async (req: Request, res: Response) => {
    const context = this.getPolicyContext(req);
    const orders = await manufacturingOrderService.getOrdersByWarehouse(context.organizationId, req.params.warehouseId!);

    const response: ApiResponse<typeof orders> = {
      success: true,
      data: orders,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  });
}

export const manufacturingOrderController = new ManufacturingOrderController();
