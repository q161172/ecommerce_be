import { Router } from 'express';
import * as cartController from './cart.controller';
import { authenticate } from '../../middleware/authenticate';
import 'express-async-errors';

const router = Router();

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/items', cartController.addItem);
router.put('/items/:itemId', cartController.updateItem);
router.delete('/items/:itemId', cartController.removeItem);
router.delete('/', cartController.clearCart);

export default router;
