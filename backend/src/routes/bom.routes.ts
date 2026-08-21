import { Router } from 'express';
import { bomController } from '../controllers/bom.controller';
import { bomExplosionController } from '../controllers/bomExplosion.controller';
import { validateRequest } from '../middleware/validation';
import { requirePermission } from '../middleware/rbac';
import { idParamSchema } from '../schemas/common.schema';
import {
  createBomSchema,
  updateBomSchema,
  createBomItemSchema,
  updateBomItemSchema,
  listBomsQuerySchema,
  bomItemParamsSchema,
  productBomsParamsSchema,
} from '../schemas/bom.schema';

const router = Router();

// BOM Explosion Engine (Phase 032)
router.post('/explode', requirePermission('bom:read'), bomExplosionController.explodeBom);
router.get('/:id/explosion', requirePermission('bom:read'), bomExplosionController.getBomExplosion);

// BOM CRUD & Component Operations
router.post(
  '/',
  requirePermission('bom:write'),
  validateRequest({ body: createBomSchema }),
  bomController.createBom,
);

router.get(
  '/',
  requirePermission('bom:read'),
  validateRequest({ query: listBomsQuerySchema }),
  bomController.listBoms,
);

router.get(
  '/:id',
  requirePermission('bom:read'),
  validateRequest({ params: idParamSchema }),
  bomController.getBom,
);

router.patch(
  '/:id',
  requirePermission('bom:write'),
  validateRequest({ params: idParamSchema, body: updateBomSchema }),
  bomController.updateBom,
);

router.delete(
  '/:id',
  requirePermission('bom:delete'),
  validateRequest({ params: idParamSchema }),
  bomController.deleteBom,
);

// Component Operations
router.post(
  '/:id/components',
  requirePermission('bom:write'),
  validateRequest({ params: idParamSchema, body: createBomItemSchema }),
  bomController.addComponent,
);

router.patch(
  '/:id/components/:componentId',
  requirePermission('bom:write'),
  validateRequest({ params: bomItemParamsSchema, body: updateBomItemSchema }),
  bomController.updateComponent,
);

router.delete(
  '/:id/components/:componentId',
  requirePermission('bom:write'),
  validateRequest({ params: bomItemParamsSchema }),
  bomController.removeComponent,
);

// BOM Workflows, Revisions & Status
router.post(
  '/:id/activate',
  requirePermission('bom:manage'),
  validateRequest({ params: idParamSchema }),
  bomController.activateBom,
);

router.post(
  '/:id/deactivate',
  requirePermission('bom:manage'),
  validateRequest({ params: idParamSchema }),
  bomController.deactivateBom,
);

router.post(
  '/:id/archive',
  requirePermission('bom:manage'),
  validateRequest({ params: idParamSchema }),
  bomController.archiveBom,
);

router.post(
  '/:id/revision',
  requirePermission('bom:manage'),
  validateRequest({ params: idParamSchema }),
  bomController.createRevision,
);

router.post(
  '/:id/default',
  requirePermission('bom:manage'),
  validateRequest({ params: idParamSchema }),
  bomController.setDefaultBom,
);

router.get(
  '/product/:productId',
  requirePermission('bom:read'),
  validateRequest({ params: productBomsParamsSchema }),
  bomController.getProductBoms,
);

export const bomRoutes = router;
