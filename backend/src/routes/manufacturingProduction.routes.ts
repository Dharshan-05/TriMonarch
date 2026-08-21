import { Router } from 'express';
import { manufacturingProductionController } from '../controllers/manufacturingProduction.controller';

const router = Router();

// Single Production record lookup
router.get('/:productionId', manufacturingProductionController.getProduction);

export const manufacturingProductionRoutes = router;
