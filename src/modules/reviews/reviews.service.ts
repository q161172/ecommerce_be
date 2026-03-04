import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';

export interface CreateReviewDto {
    rating: number;
    comment?: string;
}

export const createReview = async (userId: string, productId: string, dto: CreateReviewDto) => {
    // Verify user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
        where: {
            productId,
            order: { userId, status: 'DELIVERED' },
        },
    });
    if (!hasPurchased) throw createError('You can only review products you have purchased', 403);

    return prisma.review.upsert({
        where: { userId_productId: { userId, productId } },
        create: { userId, productId, ...dto },
        update: dto,
        include: { user: { select: { name: true, avatar: true } } },
    });
};

export const getProductReviews = async (productId: string) => {
    const reviews = await prisma.review.findMany({
        where: { productId },
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
    });

    const avg =
        reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

    return { reviews, avgRating: Math.round(avg * 10) / 10, total: reviews.length };
};

export const deleteReview = async (id: string, userId: string, isAdmin: boolean) => {
    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) throw createError('Review not found', 404);
    if (!isAdmin && review.userId !== userId) throw createError('Forbidden', 403);
    return prisma.review.delete({ where: { id } });
};
