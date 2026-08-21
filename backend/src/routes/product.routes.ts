import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { validateRequest } from '../middleware/validation';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema } from '../schemas/common.schema';
import {
  createProductSchema,
  updateProductSchema,
  productStatusSchema,
  productQuerySchema,
} from '../schemas/product.schema';

const router = Router();

router.post(
  '/',
  requirePermission('product:write'),
  validateRequest({ body: createProductSchema }),
  asyncHandler(productController.create),
);

router.get(
  '/',
  requirePermission('product:read'),
  validateRequest({ query: productQuerySchema }),
  asyncHandler(productController.list),
);

router.get(
  '/:id',
  requirePermission('product:read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(productController.getById),
);

router.patch(
  '/:id',
  requirePermission('product:write'),
  validateRequest({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(productController.update),
);

router.patch(
  '/:id/status',
  requirePermission('product:write'),
  validateRequest({ params: idParamSchema, body: productStatusSchema }),
  asyncHandler(productController.updateStatus),
);

router.delete(
  '/:id',
  requirePermission('product:write'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(productController.delete),
);

export default router;
