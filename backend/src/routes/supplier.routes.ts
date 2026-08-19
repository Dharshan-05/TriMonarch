import { Router } from 'express';
import { supplierController } from '../controllers/supplier.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import { createSupplierSchema, updateSupplierSchema } from '../schemas/supplier.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createSupplierSchema }),
  asyncHandler(supplierController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(supplierController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(supplierController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateSupplierSchema }),
  asyncHandler(supplierController.update),
);

export default router;
