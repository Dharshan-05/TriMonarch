import { Router } from 'express';
import { purchaseOrderController } from '../controllers/purchaseOrder.controller';
import { validateRequest } from '../middleware/validation';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema } from '../schemas/common.schema';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderSchema,
  purchaseOrderStatusUpdateSchema,
  createPurchaseOrderItemSchema,
  updatePurchaseOrderItemSchema,
  listPurchaseOrdersQuerySchema,
} from '../schemas/purchaseOrder.schema';

const router = Router();

// Purchase Order CRUD
router.post(
  '/',
  requirePermission('purchase_order:write'),
  validateRequest({ body: createPurchaseOrderSchema }),
  asyncHandler(purchaseOrderController.createPurchaseOrder),
);

router.get(
  '/',
  requirePermission('purchase_order:read'),
  validateRequest({ query: listPurchaseOrdersQuerySchema }),
  asyncHandler(purchaseOrderController.listPurchaseOrders),
);

router.get(
  '/:id',
  requirePermission('purchase_order:read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(purchaseOrderController.getPurchaseOrder),
);

router.patch(
  '/:id',
  requirePermission('purchase_order:write'),
  validateRequest({ params: idParamSchema, body: updatePurchaseOrderSchema }),
  asyncHandler(purchaseOrderController.updatePurchaseOrder),
);

router.patch(
  '/:id/status',
  requirePermission('purchase_order:write'),
  validateRequest({ params: idParamSchema, body: purchaseOrderStatusUpdateSchema }),
  asyncHandler(purchaseOrderController.updateStatus),
);

router.delete(
  '/:id',
  requirePermission('purchase_order:delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(purchaseOrderController.deletePurchaseOrder),
);

// Line Item Operations
router.post(
  '/:id/items',
  requirePermission('purchase_order:write'),
  validateRequest({ params: idParamSchema, body: createPurchaseOrderItemSchema }),
  asyncHandler(purchaseOrderController.addItem),
);

router.patch(
  '/:id/items/:itemId',
  requirePermission('purchase_order:write'),
  validateRequest({ body: updatePurchaseOrderItemSchema }),
  asyncHandler(purchaseOrderController.updateItem),
);

router.delete(
  '/:id/items/:itemId',
  requirePermission('purchase_order:write'),
  asyncHandler(purchaseOrderController.removeItem),
);

// State Transition Convenience Shortcuts
router.post(
  '/:id/submit',
  requirePermission('purchase_order:write'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(purchaseOrderController.submitPurchaseOrder),
);

router.post(
  '/:id/approve',
  requirePermission('purchase_order:approve'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(purchaseOrderController.approvePurchaseOrder),
);

router.post(
  '/:id/cancel',
  requirePermission('purchase_order:write'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(purchaseOrderController.cancelPurchaseOrder),
);

router.post(
  '/:id/partially-received',
  requirePermission('purchase_order:write'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(purchaseOrderController.markPartiallyReceived),
);

router.post(
  '/:id/received',
  requirePermission('purchase_order:write'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(purchaseOrderController.markReceived),
);

export const purchaseOrderRoutes = router;
