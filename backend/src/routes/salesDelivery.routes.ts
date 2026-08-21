import { Router } from 'express';
import { salesDeliveryController } from '../controllers/salesDelivery.controller';

const router = Router();

// Delivery CRUD & Items
router.post('/', salesDeliveryController.createDelivery);
router.get('/', salesDeliveryController.listDeliveries);
router.get('/:id', salesDeliveryController.getDelivery);
router.post('/:id/items', salesDeliveryController.addDeliveryItem);
router.delete('/:id/items/:itemId', salesDeliveryController.removeDeliveryItem);

// Delivery State Transitions
router.post('/:id/confirm', salesDeliveryController.confirmDelivery);
router.post('/:id/picking', salesDeliveryController.startPicking);
router.post('/:id/pack', salesDeliveryController.markPacked);
router.post('/:id/ship', salesDeliveryController.shipDelivery);
router.post('/:id/deliver', salesDeliveryController.deliverDelivery);
router.post('/:id/cancel', salesDeliveryController.cancelDelivery);

export const salesDeliveryRoutes = router;
