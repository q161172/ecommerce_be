import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';
import { stripe } from '../../config/stripe';
import { env } from '../../config/env';
import { clearCart } from '../cart/cart.service';

export interface CreateOrderDto {
    addressId: string;
    notes?: string;
}

export const createOrder = async (userId: string, dto: CreateOrderDto) => {
    const cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: true,
                    variant: true,
                },
            },
        },
    });

    if (!cart || cart.items.length === 0) throw createError('Cart is empty', 400);

    const address = await prisma.address.findFirst({ where: { id: dto.addressId, userId } });
    if (!address) throw createError('Address not found', 404);

    // Validate stock
    for (const item of cart.items) {
        if (item.variant.stock < item.quantity)
            throw createError(`Insufficient stock for ${item.product.name} (${item.variant.size}/${item.variant.color})`, 400);
    }

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
    const shippingFee = subtotal >= 500000 ? 0 : 30000; // Free shipping over 500k VND
    const total = subtotal + shippingFee;

    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
            data: {
                userId,
                addressId: dto.addressId,
                notes: dto.notes,
                subtotal,
                shippingFee,
                total,
                items: {
                    create: cart.items.map((item) => ({
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        price: item.product.price,
                        productName: item.product.name,
                        variantInfo: `${item.variant.size} / ${item.variant.color}`,
                    })),
                },
            },
            include: { items: true, address: true },
        });

        // Deduct stock
        for (const item of cart.items) {
            await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { decrement: item.quantity } },
            });
        }

        return newOrder;
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: cart.items.map((item) => ({
            price_data: {
                currency: 'vnd',
                product_data: {
                    name: `${item.product.name} (${item.variant.size}/${item.variant.color})`,
                    images: item.product.images.slice(0, 1),
                },
                unit_amount: Math.round(Number(item.product.price)),
            },
            quantity: item.quantity,
        })),
        mode: 'payment',
        success_url: `${env.FRONTEND_URL}/orders/${order.id}?payment=success`,
        cancel_url: `${env.FRONTEND_URL}/checkout?payment=cancelled`,
        metadata: { orderId: order.id },
    });

    await prisma.payment.create({
        data: { orderId: order.id, sessionId: session.id, amount: total },
    });

    await clearCart(userId);

    return { order, checkoutUrl: session.url };
};

export const getUserOrders = async (userId: string) => {
    return prisma.order.findMany({
        where: { userId },
        include: {
            items: { include: { product: { select: { images: true } } } },
            payment: { select: { status: true } },
            address: true,
        },
        orderBy: { createdAt: 'desc' },
    });
};

export const getOrderById = async (id: string, userId?: string) => {
    const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, payment: true, address: true },
    });
    if (!order) throw createError('Order not found', 404);
    if (userId && order.userId !== userId) throw createError('Forbidden', 403);
    return order;
};

export const updateOrderStatus = async (id: string, status: string) => {
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) throw createError('Order not found', 404);
    return prisma.order.update({ where: { id }, data: { status: status as any } });
};

export const getAllOrders = async (page = 1, limit = 20, status?: string) => {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};
    const [orders, total] = await Promise.all([
        prisma.order.findMany({
            where,
            skip,
            take: limit,
            include: { user: { select: { name: true, email: true } }, payment: true },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
};
