import { Router } from 'express';
import * as categoriesController from './categories.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import multer from 'multer';
import 'express-async-errors';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', categoriesController.getAll);
router.get('/:slug', categoriesController.getBySlug);
router.post('/', authenticate, authorize('ADMIN'), upload.single('image'), categoriesController.create);
router.put('/:id', authenticate, authorize('ADMIN'), upload.single('image'), categoriesController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), categoriesController.remove);

export default router;
