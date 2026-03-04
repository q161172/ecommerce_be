import { Router } from 'express';
import { getStats } from './admin.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import 'express-async-errors';

const router = Router();

router.get('/stats', authenticate, authorize('ADMIN'), getStats);

export default router;
