import { Router } from 'express';
import * as usersController from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import 'express-async-errors';

const router = Router();

// Customer routes
router.get('/me', authenticate, usersController.getProfile);
router.put('/me', authenticate, usersController.updateProfile);
router.post('/me/addresses', authenticate, usersController.addAddress);
router.put('/me/addresses/:addressId', authenticate, usersController.updateAddress);
router.delete('/me/addresses/:addressId', authenticate, usersController.deleteAddress);

// Admin routes
router.get('/', authenticate, authorize('ADMIN'), usersController.getAllUsers);
router.patch('/:id/toggle-active', authenticate, authorize('ADMIN'), usersController.toggleUserActive);
router.patch('/:id/role', authenticate, authorize('ADMIN'), usersController.changeUserRole);

export default router;
