import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';

export const getCart = async (userId: string) => {
    let cart = await prisma.cart.findUnique({
        where: { userId },
        include: {
            items: {
                include: {
                    product: { select: { id: true, name: true, slug: true, images: true, price: true } },
                    variant: { select: { id: true, size: true, color: true, stock: true } },
                },
            },
        },
    });

    if (!cart) {
        cart = await prisma.cart.create({
            data: { userId },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true, slug: true, images: true, price: true } },
                        variant: { select: { id: true, size: true, color: true, stock: true } },
                    },
                },
            },
        });
    }

    return cart;
};

export const addItem = async (userId: string, productId: string, variantId: string, quantity: number) => {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) throw createError('Variant not found', 404);
    if (variant.stock < quantity) throw createError('Insufficient stock', 400);

    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) cart = await prisma.cart.create({ data: { userId } });

    const existing = await prisma.cartItem.findUnique({
        where: { cartId_variantId: { cartId: cart.id, variantId } },
    });

    if (existing) {
        const newQty = existing.quantity + quantity;
        if (variant.stock < newQty) throw createError('Insufficient stock', 400);
        return prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: newQty },
        });
    }

    return prisma.cartItem.create({ data: { cartId: cart.id, productId, variantId, quantity } });
};

export const updateItem = async (userId: string, itemId: string, quantity: number) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw createError('Cart not found', 404);

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw createError('Item not found in cart', 404);

    const variant = await prisma.productVariant.findUnique({ where: { id: item.variantId } });
    if (!variant || variant.stock < quantity) throw createError('Insufficient stock', 400);

    if (quantity === 0) return prisma.cartItem.delete({ where: { id: itemId } });
    return prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
};

export const removeItem = async (userId: string, itemId: string) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw createError('Cart not found', 404);

    const item = await prisma.cartItem.findFirst({ where: { id: itemId, cartId: cart.id } });
    if (!item) throw createError('Item not found in cart', 404);

    return prisma.cartItem.delete({ where: { id: itemId } });
};

export const clearCart = async (userId: string) => {
    const cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;
    return prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
};
