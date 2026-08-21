import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { validateRequest } from '../middleware/validation';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema } from '../schemas/common.schema';
import {
  createInventorySchema,
  updateInventorySchema,
  adjustInventorySchema,
  inventoryQuerySchema,
} from '../schemas/inventory.schema';

const router = Router();

router.post(
  '/',
  requirePermission('inventory:write'),
  validateRequest({ body: createInventorySchema }),
  asyncHandler(inventoryController.create),
);

router.get(
  '/',
  requirePermission('inventory:read'),
  validateRequest({ query: inventoryQuerySchema }),
  asyncHandler(inventoryController.list),
);

router.get(
  '/:id',
  requirePermission('inventory:read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(inventoryController.getById),
);

router.get(
  '/:id/movements',
  requirePermission('inventory:read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(inventoryController.getMovements),
);

router.patch(
  '/:id',
  requirePermission('inventory:write'),
  validateRequest({ params: idParamSchema, body: updateInventorySchema }),
  asyncHandler(inventoryController.update),
);

router.patch(
  '/:id/adjust',
  requirePermission('inventory:adjust'),
  validateRequest({ params: idParamSchema, body: adjustInventorySchema }),
  asyncHandler(inventoryController.adjust),
);

router.delete(
  '/:id',
  requirePermission('inventory:delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(inventoryController.delete),
);

export default router;
