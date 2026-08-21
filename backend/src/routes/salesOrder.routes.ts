import { Router } from 'express';
import { salesOrderController } from '../controllers/salesOrder.controller';
import { validateRequest } from '../middleware/validation';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema } from '../schemas/common.schema';
import {
  createSalesOrderSchema,
  createSalesOrderWithItemsSchema,
  updateSalesOrderSchema,
  salesOrderStatusUpdateSchema,
  salesOrderQuerySchema,
  createSalesOrderItemSchema,
  updateSalesOrderItemSchema,
} from '../schemas/salesOrder.schema';

const router = Router();

router.post(
  '/',
  requirePermission('sales_order:write'),
  validateRequest({ body: createSalesOrderWithItemsSchema.or(createSalesOrderSchema) }),
  asyncHandler(salesOrderController.create),
);

router.get(
  '/',
  requirePermission('sales_order:read'),
  validateRequest({ query: salesOrderQuerySchema }),
  asyncHandler(salesOrderController.list),
);

router.get(
  '/:id',
  requirePermission('sales_order:read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(salesOrderController.getById),
);

router.patch(
  '/:id',
  requirePermission('sales_order:write'),
  validateRequest({ params: idParamSchema, body: updateSalesOrderSchema }),
  asyncHandler(salesOrderController.update),
);

router.patch(
  '/:id/status',
  requirePermission('sales_order:write'),
  validateRequest({ params: idParamSchema, body: salesOrderStatusUpdateSchema }),
  asyncHandler(salesOrderController.updateStatus),
);

router.delete(
  '/:id',
  requirePermission('sales_order:delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(salesOrderController.delete),
);

// Order Line Item Management
router.post(
  '/:id/items',
  requirePermission('sales_order:write'),
  validateRequest({ params: idParamSchema, body: createSalesOrderItemSchema }),
  asyncHandler(salesOrderController.addItem),
);

router.patch(
  '/:id/items/:itemId',
  requirePermission('sales_order:write'),
  validateRequest({ body: updateSalesOrderItemSchema }),
  asyncHandler(salesOrderController.updateItem),
);

router.delete(
  '/:id/items/:itemId',
  requirePermission('sales_order:write'),
  asyncHandler(salesOrderController.deleteItem),
);

export default router;
