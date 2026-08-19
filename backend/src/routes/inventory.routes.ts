import { Router } from 'express';
import { inventoryController } from '../controllers/inventory.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import { updateInventorySchema } from '../schemas/inventory.schema';

const router = Router();

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(inventoryController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(inventoryController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateInventorySchema }),
  asyncHandler(inventoryController.update),
);

export default router;
