import { Request, Response } from 'express';
import { purchaseOrderService } from '../services/purchaseOrder.service';
import { purchaseOrderStateMachineService } from '../services/purchaseOrderStateMachine.service';
import { policyEngine } from '../services/policyEngine.service';
import { getOrganizationId } from '../middleware/organizationContext';
import { ApiResponse, ApiPaginatedResponse } from '../types/api';
import { PolicyContext } from '../types/policy';
import { AuthenticationError } from '../utils/jwt';
import { PurchaseOrderStatus } from '../types/database';

export class PurchaseOrderController {
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

  createPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'CREATE', 'PURCHASE_ORDER');

    const po = await purchaseOrderService.createPurchaseOrder(
      {
        ...req.body,
        organization_id: context.organizationId,
      },
      context.userId,
      req.id,
    );

    const response: ApiResponse<typeof po> = {
      success: true,
      data: po,
      meta: { requestId: req.id },
    };
    res.status(201).json(response);
  };

  getPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const result = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'READ', 'PURCHASE_ORDER', result);

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  listPurchaseOrders = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);

    policyEngine.assertCan(context, 'LIST', 'PURCHASE_ORDER');

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 20;
    const sortBy = req.query.sortBy as string | undefined;
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;
    const queryStr = (req.query.search || req.query.query) as string | undefined;
    const supplierId = (req.query.supplierId || req.query.supplier_id) as string | undefined;
    const warehouseId = (req.query.warehouseId || req.query.warehouse_id) as string | undefined;
    const status = req.query.status as string | undefined;
    const orderDate = (req.query.orderDate || req.query.order_date) as string | undefined;
    const expectedDeliveryDate = (req.query.expectedDeliveryDate || req.query.expected_delivery_date) as string | undefined;

    const result = await purchaseOrderService.listPurchaseOrders(context.organizationId, {
      page,
      pageSize,
      sortBy,
      sortOrder,
      query: queryStr,
      supplierId,
      warehouseId,
      status,
      orderDate,
      expectedDeliveryDate,
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

  updatePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const existing = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', existing);

    const updated = await purchaseOrderService.updatePurchaseOrder(
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
    const existing = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);
    const targetStatus = req.body.status as PurchaseOrderStatus;

    if (targetStatus === 'approved') {
      policyEngine.assertCan(context, 'APPROVE', 'PURCHASE_ORDER', existing);
    } else {
      policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', existing);
    }

    const updated = await purchaseOrderStateMachineService.transitionPurchaseOrder(
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

  deletePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const existing = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'DELETE', 'PURCHASE_ORDER', existing);

    await purchaseOrderService.deletePurchaseOrder(context.organizationId, req.params.id!, context.userId, req.id);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Purchase order successfully deleted' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  addItem = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const po = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', po);

    const item = await purchaseOrderService.addItem(
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
    const po = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', po);

    const item = await purchaseOrderService.updateItem(
      context.organizationId,
      req.params.id!,
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

  removeItem = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const po = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', po);

    await purchaseOrderService.removeItem(
      context.organizationId,
      req.params.id!,
      req.params.itemId!,
      context.userId,
      req.id,
    );

    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: { message: 'Purchase order item removed successfully' },
      meta: { requestId: req.id },
    };
    res.status(200).json(response);
  };

  submitPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const po = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', po);

    const updated = await purchaseOrderService.submitPurchaseOrder(
      context.organizationId,
      req.params.id!,
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

  approvePurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const po = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'APPROVE', 'PURCHASE_ORDER', po);

    const updated = await purchaseOrderService.approvePurchaseOrder(
      context.organizationId,
      req.params.id!,
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

  cancelPurchaseOrder = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const po = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', po);

    const updated = await purchaseOrderService.cancelPurchaseOrder(
      context.organizationId,
      req.params.id!,
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

  markPartiallyReceived = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const po = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', po);

    const updated = await purchaseOrderService.markPartiallyReceived(
      context.organizationId,
      req.params.id!,
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

  markReceived = async (req: Request, res: Response): Promise<void> => {
    const context = this.getPolicyContext(req);
    const po = await purchaseOrderService.getPurchaseOrder(context.organizationId, req.params.id!);

    policyEngine.assertCan(context, 'UPDATE', 'PURCHASE_ORDER', po);

    const updated = await purchaseOrderService.markReceived(
      context.organizationId,
      req.params.id!,
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
}

export const purchaseOrderController = new PurchaseOrderController();
