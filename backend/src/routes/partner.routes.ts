import { Router } from 'express';
import { partnerController } from '../controllers/partner.controller';
import { validateRequest } from '../middleware/validation';
import { requirePermission } from '../middleware/rbac';
import { asyncHandler } from '../utils/asyncHandler';
import { idParamSchema } from '../schemas/common.schema';
import {
  createPartnerSchema,
  updatePartnerSchema,
  partnerQuerySchema,
} from '../schemas/partner.schema';

const router = Router();

router.post(
  '/',
  requirePermission('partner:create'),
  validateRequest({ body: createPartnerSchema }),
  asyncHandler(partnerController.create),
);

router.get(
  '/',
  requirePermission('partner:read'),
  validateRequest({ query: partnerQuerySchema }),
  asyncHandler(partnerController.list),
);

router.get(
  '/:id',
  requirePermission('partner:read'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(partnerController.getById),
);

router.patch(
  '/:id',
  requirePermission('partner:update'),
  validateRequest({ params: idParamSchema, body: updatePartnerSchema }),
  asyncHandler(partnerController.update),
);

router.delete(
  '/:id',
  requirePermission('partner:delete'),
  validateRequest({ params: idParamSchema }),
  asyncHandler(partnerController.delete),
);

export default router;
