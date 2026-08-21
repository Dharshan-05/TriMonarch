import { Router } from 'express';
import { purchaseReceiptController } from '../controllers/purchaseReceipt.controller';

const router = Router();

// Purchase Receipt CRUD & Items
router.post('/', purchaseReceiptController.createReceipt);
router.get('/', purchaseReceiptController.listReceipts);
router.get('/:id', purchaseReceiptController.getReceipt);
router.post('/:id/items', purchaseReceiptController.addItem);
router.patch('/:id/items/:itemId', purchaseReceiptController.updateItem);
router.delete('/:id/items/:itemId', purchaseReceiptController.removeItem);

// Purchase Receipt State Transitions & Workflows
router.post('/:id/post', purchaseReceiptController.postReceipt);
router.post('/:id/complete', purchaseReceiptController.completeReceipt);
router.post('/:id/cancel', purchaseReceiptController.cancelReceipt);

export const purchaseReceiptRoutes = router;
