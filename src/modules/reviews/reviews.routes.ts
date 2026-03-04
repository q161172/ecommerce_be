import { Router } from 'express';
import * as reviewsController from './reviews.controller';
import { authenticate } from '../../middleware/authenticate';
import 'express-async-errors';

const router = Router();

router.get('/product/:productId', reviewsController.getProductReviews);
router.post('/product/:productId', authenticate, reviewsController.createReview);
router.delete('/:id', authenticate, reviewsController.deleteReview);

export default router;
