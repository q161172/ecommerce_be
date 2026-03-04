import { Router } from 'express';
import * as ordersController from './orders.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import 'express-async-errors';

const router = Router();

// Customer routes
router.post('/', authenticate, ordersController.createOrder);
router.get('/my', authenticate, ordersController.getMyOrders);
router.get('/my/:id', authenticate, ordersController.getOrderById);

// Admin routes
router.get('/', authenticate, authorize('ADMIN'), ordersController.getAllOrders);
router.patch('/:id/status', authenticate, authorize('ADMIN'), ordersController.updateOrderStatus);

export default router;
