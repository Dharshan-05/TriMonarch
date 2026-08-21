import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validateRequest } from '../middleware/validation';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema } from '../schemas/common.schema';
import {
  createUserSchema,
  updateUserSchema,
  userStatusSchema,
  userQuerySchema,
} from '../schemas/user.schema';

const router = Router();

router.post(
  '/',
  requirePermission('user:create'),
  validateRequest({ body: createUserSchema }),
  asyncHandler(userController.create),
);

router.get(
  '/',
  requirePermission('user:read'),
  validateRequest({ query: userQuerySchema }),
  asyncHandler(userController.list),
);

router.get(
  '/:id',
  requirePermission('user:read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(userController.getById),
);

router.patch(
  '/:id',
  requirePermission('user:update'),
  validateRequest({ params: idParamSchema, body: updateUserSchema }),
  asyncHandler(userController.update),
);

router.patch(
  '/:id/status',
  requirePermission('user:update'),
  validateRequest({ params: idParamSchema, body: userStatusSchema }),
  asyncHandler(userController.updateStatus),
);

router.get(
  '/:id/roles',
  requirePermission('role:read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(userController.getRoles),
);

router.delete(
  '/:id',
  requirePermission('user:delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(userController.delete),
);

export default router;
