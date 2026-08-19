import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import { createUserSchema, updateUserSchema } from '../schemas/user.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createUserSchema }),
  asyncHandler(userController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(userController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(userController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(userController.update),
);

export default router;
