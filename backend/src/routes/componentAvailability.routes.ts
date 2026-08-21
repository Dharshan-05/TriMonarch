import { Router } from 'express';
import { componentAvailabilityController } from '../controllers/componentAvailability.controller';

const router = Router();

router.get('/:id/component-availability', componentAvailabilityController.getComponentAvailability);
router.get('/:id/readiness', componentAvailabilityController.getReadiness);

export const componentAvailabilityRoutes = router;
