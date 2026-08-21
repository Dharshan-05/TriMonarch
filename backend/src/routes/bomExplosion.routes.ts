import { Router } from 'express';
import { bomExplosionController } from '../controllers/bomExplosion.controller';

const router = Router();

// POST /api/v1/boms/explode
router.post('/explode', bomExplosionController.explodeBom);

// GET /api/v1/boms/:id/explosion
router.get('/:id/explosion', bomExplosionController.getBomExplosion);

export const bomExplosionRoutes = router;
