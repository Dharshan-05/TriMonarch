import { Router } from 'express';
import { roleController } from '../controllers/role.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import {
  createRoleSchema,
  updateRoleSchema,
  userRoleParamSchema,
  userIdParamSchema,
} from '../schemas/role.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createRoleSchema }),
  asyncHandler(roleController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(roleController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(roleController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateRoleSchema }),
  asyncHandler(roleController.update),
);

// User Roles Assignment endpoints
router.post(
  '/users/:userId/roles/:roleId',
  validateRequest({ params: userRoleParamSchema }),
  asyncHandler(roleController.assignRoleToUser),
);

router.delete(
  '/users/:userId/roles/:roleId',
  validateRequest({ params: userRoleParamSchema }),
  asyncHandler(roleController.removeRoleFromUser),
);

router.get(
  '/users/:userId/roles',
  validateRequest({ params: userIdParamSchema }),
  asyncHandler(roleController.listUserRoles),
);

export default router;
