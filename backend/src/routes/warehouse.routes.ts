import { Router } from 'express';
import { warehouseController } from '../controllers/warehouse.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
} from '../schemas/warehouse.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createWarehouseSchema }),
  asyncHandler(warehouseController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(warehouseController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(warehouseController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateWarehouseSchema }),
  asyncHandler(warehouseController.update),
);

export default router;
