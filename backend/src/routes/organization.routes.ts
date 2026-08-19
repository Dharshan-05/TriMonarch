import { Router } from 'express';
import { organizationController } from '../controllers/organization.controller';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema, paginationQuerySchema } from '../schemas/common.schema';
import {
  createOrganizationSchema,
  updateOrganizationSchema,
} from '../schemas/organization.schema';

const router = Router();

router.post(
  '/',
  validateRequest({ body: createOrganizationSchema }),
  asyncHandler(organizationController.create),
);

router.get(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(organizationController.getById),
);

router.get(
  '/',
  validateRequest({ query: paginationQuerySchema }),
  asyncHandler(organizationController.list),
);

router.patch(
  '/:id',
  validateRequest({ params: idParamSchema, body: updateOrganizationSchema }),
  asyncHandler(organizationController.update),
);

router.delete(
  '/:id',
  validateRequest({ params: idParamSchema }),
  asyncHandler(organizationController.delete),
);

export default router;
