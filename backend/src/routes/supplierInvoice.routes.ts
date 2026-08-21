import { Router } from 'express';
import { supplierInvoiceController } from '../controllers/supplierInvoice.controller';
import { supplierPaymentController } from '../controllers/supplierPayment.controller';

const router = Router();

// Supplier Invoice CRUD & Items
router.post('/', supplierInvoiceController.createInvoice);
router.get('/', supplierInvoiceController.listInvoices);
router.get('/:id', supplierInvoiceController.getInvoice);
router.post('/:id/items', supplierInvoiceController.addItem);
router.patch('/:id/items/:itemId', supplierInvoiceController.updateItem);
router.delete('/:id/items/:itemId', supplierInvoiceController.removeItem);

// Supplier Invoice Workflows & Payments
router.post('/:id/post', supplierInvoiceController.postInvoice);
router.post('/:id/cancel', supplierInvoiceController.cancelInvoice);
router.post('/:id/payments', supplierPaymentController.recordPayment);
router.get('/:id/payments', supplierPaymentController.listInvoicePayments);

export const supplierInvoiceRoutes = router;
