import { Router } from 'express';
import { handleWebhook } from './payment.controller';
import 'express-async-errors';

const router = Router();

// Stripe webhooks must receive raw body — set up before express.json() in app.ts
router.post('/webhook', handleWebhook);

export default router;
