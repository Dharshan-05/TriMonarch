import { Router } from 'express';
import { accountsPayableController } from '../controllers/accountsPayable.controller';

const router = Router();

router.get('/summary', accountsPayableController.getAPSummary);
router.get('/aging', accountsPayableController.getAPAging);

export const accountsPayableRoutes = router;
