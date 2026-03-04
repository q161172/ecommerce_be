import { Request, Response } from 'express';
import { stripe } from '../../config/stripe';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
    const sig = req.headers['stripe-signature'] as string;

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        res.status(400).json({ message: `Webhook Error: ${(err as Error).message}` });
        return;
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as { id: string; payment_intent: string };

        const payment = await prisma.payment.findUnique({ where: { sessionId: session.id } });
        if (payment) {
            await prisma.payment.update({
                where: { sessionId: session.id },
                data: {
                    status: 'COMPLETED',
                    transactionId: session.payment_intent,
                },
            });
            await prisma.order.update({
                where: { id: payment.orderId },
                data: { status: 'PROCESSING' },
            });
        }
    }

    if (event.type === 'checkout.session.expired') {
        const session = event.data.object as { id: string };
        const payment = await prisma.payment.findUnique({ where: { sessionId: session.id } });
        if (payment) {
            await prisma.payment.update({ where: { sessionId: session.id }, data: { status: 'FAILED' } });
            await prisma.order.update({ where: { id: payment.orderId }, data: { status: 'CANCELLED' } });
        }
    }

    res.json({ received: true });
};
