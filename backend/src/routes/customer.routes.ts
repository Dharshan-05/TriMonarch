import { Router } from 'express';
import { customerController } from '../controllers/customer.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import { createCustomerSchema, updateCustomerSchema } from '../schemas/customer.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createCustomerSchema }),
  asyncHandler(customerController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(customerController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(customerController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateCustomerSchema }),
  asyncHandler(customerController.update),
);

export default router;
