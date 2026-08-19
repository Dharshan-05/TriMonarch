import { Router } from 'express';
import { employeeController } from '../controllers/employee.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from '../schemas/employee.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createEmployeeSchema }),
  asyncHandler(employeeController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(employeeController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(employeeController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateEmployeeSchema }),
  asyncHandler(employeeController.update),
);

export default router;
