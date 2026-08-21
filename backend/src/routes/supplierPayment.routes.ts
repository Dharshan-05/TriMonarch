import { Router } from 'express';
import { supplierPaymentController } from '../controllers/supplierPayment.controller';

const router = Router();

router.get('/', supplierPaymentController.listPayments);

export const supplierPaymentRoutes = router;
