import { Router } from 'express';
import { departmentController } from '../controllers/department.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
} from '../schemas/department.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createDepartmentSchema }),
  asyncHandler(departmentController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(departmentController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(departmentController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateDepartmentSchema }),
  asyncHandler(departmentController.update),
);

export default router;
