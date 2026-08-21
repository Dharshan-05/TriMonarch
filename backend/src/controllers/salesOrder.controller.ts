import { Request, Response } from 'express';
import { salesOrderService } from '../services/salesOrder.service';
import { salesOrderStateMachineService, SalesOrderStatus } from '../services/salesOrderStateMachine.service';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';

export class SalesOrderController {
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

    policyEngine.assertCan(context, 'CREATE', 'SALES_ORDER');

    let result;
    if (req.body.items && Array.isArray(req.body.items) && req.body.items.length > 0) {
      result = await salesOrderService.createSalesOrderWithItems(
        { ...req.body, organization_id: context.organizationId },
        context.userId,
        req.id,
      );
    } else {
      const order = await salesOrderService.createSalesOrder(
        { ...req.body, organization_id: context.organizationId },
        context.userId,
        req.id,
      );
      result = { order, items: [] };
    }

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const order = await salesOrderService.getSalesOrderById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'SALES_ORDER', order);

    const items = await salesOrderService.getSalesOrderItems(context.organizationId, req.params.id!);

    const response: ApiResponse<{ order: typeof order; items: typeof items }> = {
      success: true,
      data: { order, items },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  list = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'LIST', 'SALES_ORDER');

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
    const queryStr = (req.query.search || req.query.query) as string | undefined;
    const customerId = (req.query.customerId || req.query.customer_id) as string | undefined;
    const status = req.query.status as string | undefined;
    const orderDate = (req.query.orderDate || req.query.order_date) as string | undefined;

    const result = await salesOrderService.listSalesOrders(context.organizationId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query: queryStr,
      customerId,
      status,
      orderDate,
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
    const existing = await salesOrderService.getSalesOrderById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'SALES_ORDER', existing);

    const updated = await salesOrderService.updateSalesOrder(
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

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const existing = await salesOrderService.getSalesOrderById(context.organizationId, req.params.id!);
    const targetStatus = req.body.status as SalesOrderStatus;

    if (targetStatus === 'confirmed') {
      policyEngine.assertCan(context, 'APPROVE', 'SALES_ORDER', existing);
    } else {
      policyEngine.assertCan(context, 'UPDATE', 'SALES_ORDER', existing);
    }

    const updated = await salesOrderStateMachineService.transitionSalesOrder(
      context.organizationId,
      req.params.id!,
      targetStatus,
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

  delete = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const existing = await salesOrderService.getSalesOrderById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'DELETE', 'SALES_ORDER', existing);

    await salesOrderService.deleteSalesOrder(context.organizationId, req.params.id!, context.userId, req.id);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Sales order successfully deleted' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  addItem = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const order = await salesOrderService.getSalesOrderById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'SALES_ORDER', order);

    const item = await salesOrderService.addSalesOrderItem(
      context.organizationId,
      req.params.id!,
      req.body,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof item> = {
      success: true,
      data: item,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  updateItem = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const order = await salesOrderService.getSalesOrderById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'SALES_ORDER', order);

    const item = await salesOrderService.updateSalesOrderItem(
      context.organizationId,
      req.params.itemId!,
      req.body,
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof item> = {
      success: true,
      data: item,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  deleteItem = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const order = await salesOrderService.getSalesOrderById(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'SALES_ORDER', order);

    await salesOrderService.deleteSalesOrderItem(
      context.organizationId,
      req.params.itemId!,
      context.userId,
      req.id,
    );

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Sales order item successfully deleted' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };
}

export const salesOrderController = new SalesOrderController();
