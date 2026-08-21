import { Router } from 'express';
import { manufacturingMaterialConsumptionController } from '../controllers/manufacturingMaterialConsumption.controller';

const router = Router();

// Single Consumption record lookup
router.get('/:consumptionId', manufacturingMaterialConsumptionController.getConsumption);

export const manufacturingMaterialConsumptionRoutes = router;
