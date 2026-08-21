import { Router } from 'express';
import { manufacturingOrderController } from '../controllers/manufacturingOrder.controller';
import { componentAvailabilityController } from '../controllers/componentAvailability.controller';
import { manufacturingMaterialConsumptionController } from '../controllers/manufacturingMaterialConsumption.controller';
import { manufacturingProductionController } from '../controllers/manufacturingProduction.controller';
import { manufacturingRollbackController } from '../controllers/manufacturingRollback.controller';
import { validateRequest } from '../middleware/validation';
import { requirePermission } from '../middleware/rbac';
import { idParamSchema } from '../schemas/common.schema';
import {
  createManufacturingOrderSchema,
  updateManufacturingOrderSchema,
  listManufacturingOrdersQuerySchema,
  productOrdersParamsSchema,
  warehouseOrdersParamsSchema,
} from '../schemas/manufacturingOrder.schema';

const router = Router();

// Base MO CRUD & Query Endpoints
router.post(
  '/',
  requirePermission('manufacturing:write'),
  validateRequest({ body: createManufacturingOrderSchema }),
  manufacturingOrderController.createOrder,
);

router.get(
  '/',
  requirePermission('manufacturing:read'),
  validateRequest({ query: listManufacturingOrdersQuerySchema }),
  manufacturingOrderController.listOrders,
);

router.get(
  '/:id',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.getOrder,
);

router.patch(
  '/:id',
  requirePermission('manufacturing:write'),
  validateRequest({ params: idParamSchema, body: updateManufacturingOrderSchema }),
  manufacturingOrderController.updateOrder,
);

router.delete(
  '/:id',
  requirePermission('manufacturing:delete'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.deleteOrder,
);

router.get(
  '/:id/items',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.getOrderItems,
);

router.get(
  '/:id/status-history',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.getStatusHistory,
);

router.get(
  '/:id/materials',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.getMaterials,
);

router.post(
  '/:id/material-check',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.materialCheck,
);

router.get(
  '/:id/component-availability',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  componentAvailabilityController.getComponentAvailability,
);

router.get(
  '/:id/readiness',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  componentAvailabilityController.getReadiness,
);

// Material Consumption Endpoints
router.post(
  '/:id/consume',
  requirePermission('manufacturing:execute'),
  validateRequest({ params: idParamSchema }),
  manufacturingMaterialConsumptionController.consumeMaterials,
);

router.post(
  '/:id/consume-material',
  requirePermission('manufacturing:execute'),
  validateRequest({ params: idParamSchema }),
  manufacturingMaterialConsumptionController.consumeMaterials,
);

router.get(
  '/:id/consumptions',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingMaterialConsumptionController.getConsumptionHistory,
);

router.get(
  '/:id/material-consumption',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingMaterialConsumptionController.getMaterialConsumptionStatus,
);

// Finished Goods Production Endpoints
router.post(
  '/:id/produce',
  requirePermission('manufacturing:execute'),
  validateRequest({ params: idParamSchema }),
  manufacturingProductionController.produceFinishedGoods,
);

router.post(
  '/:id/report-production',
  requirePermission('manufacturing:execute'),
  validateRequest({ params: idParamSchema }),
  manufacturingProductionController.produceFinishedGoods,
);

router.get(
  '/:id/productions',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingProductionController.getProductionHistory,
);

router.get(
  '/:id/production-status',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingProductionController.getProductionStatus,
);

// Rollback & Compensation Endpoints
router.post(
  '/:id/reverse-consumption',
  requirePermission('manufacturing:manage'),
  validateRequest({ params: idParamSchema }),
  manufacturingRollbackController.reverseMaterialConsumption,
);

router.get(
  '/:id/consumption-reversals',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingRollbackController.getConsumptionReversals,
);

router.post(
  '/:id/reverse-production',
  requirePermission('manufacturing:manage'),
  validateRequest({ params: idParamSchema }),
  manufacturingRollbackController.reverseFinishedGoodsProduction,
);

router.get(
  '/:id/production-reversals',
  requirePermission('manufacturing:read'),
  validateRequest({ params: idParamSchema }),
  manufacturingRollbackController.getProductionReversals,
);

router.post(
  '/:id/cancel-with-reversal',
  requirePermission('manufacturing:manage'),
  validateRequest({ params: idParamSchema }),
  manufacturingRollbackController.cancelOrderWithReversal,
);

// Lifecycle Transition Endpoints
router.post(
  '/:id/confirm',
  requirePermission('manufacturing:write'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.confirmOrder,
);

router.post(
  '/:id/plan',
  requirePermission('manufacturing:write'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.planOrder,
);

router.post(
  '/:id/release',
  requirePermission('manufacturing:approve'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.releaseOrder,
);

router.post(
  '/:id/start',
  requirePermission('manufacturing:execute'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.startOrder,
);

router.post(
  '/:id/cancel',
  requirePermission('manufacturing:approve'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.cancelOrder,
);

router.post(
  '/:id/complete',
  requirePermission('manufacturing:execute'),
  validateRequest({ params: idParamSchema }),
  manufacturingOrderController.completeOrder,
);

router.get(
  '/product/:productId',
  requirePermission('manufacturing:read'),
  validateRequest({ params: productOrdersParamsSchema }),
  manufacturingOrderController.getOrdersByProduct,
);

router.get(
  '/warehouse/:warehouseId',
  requirePermission('manufacturing:read'),
  validateRequest({ params: warehouseOrdersParamsSchema }),
  manufacturingOrderController.getOrdersByWarehouse,
);

export const manufacturingOrderRoutes = router;
