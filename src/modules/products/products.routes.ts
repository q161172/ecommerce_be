import { Router } from 'express';
import * as productsController from './products.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import multer from 'multer';
import 'express-async-errors';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', productsController.getAll);
router.get('/:slug', productsController.getBySlug);
router.post('/', authenticate, authorize('ADMIN'), upload.array('images', 10), productsController.create);
router.put('/:id', authenticate, authorize('ADMIN'), upload.array('images', 10), productsController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), productsController.remove);

export default router;
