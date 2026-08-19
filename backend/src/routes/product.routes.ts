import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createProductSchema }),
  asyncHandler(productController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(productController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(productController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateProductSchema }),
  asyncHandler(productController.update),
);

export default router;
