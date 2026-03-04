import { prisma } from '../../config/prisma';
import { cloudinary } from '../../config/cloudinary';
import { createError } from '../../middleware/errorHandler';
import { Prisma } from '@prisma/client';

export interface CreateProductDto {
    name: string;
    slug: string;
    description: string;
    price: number;
    comparePrice?: number;
    categoryId: string;
    isFeatured?: boolean;
    variants: { size: string; color: string; stock: number; sku: string }[];
}

export interface ProductFilter {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    featured?: boolean;
    sort?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

const uploadImages = async (buffers: Buffer[]): Promise<string[]> => {
    return Promise.all(
        buffers.map(
            (buf) =>
                new Promise<string>((resolve, reject) => {
                    cloudinary.uploader
                        .upload_stream({ folder: 'selling-clothes/products' }, (err, result) =>
                            err ? reject(err) : resolve(result!.secure_url)
                        )
                        .end(buf);
                })
        )
    );
};

export const getAll = async (filter: ProductFilter) => {
    const { page = 1, limit = 12, categoryId, search, minPrice, maxPrice, featured, sort } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
        isActive: true,
        ...(categoryId && { categoryId }),
        ...(featured !== undefined && { isFeatured: featured }),
        ...(search && {
            OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ],
        }),
        ...(minPrice !== undefined || maxPrice !== undefined
            ? { price: { ...(minPrice !== undefined && { gte: minPrice }), ...(maxPrice !== undefined && { lte: maxPrice }) } }
            : {}),
    };

    const orderBy: Prisma.ProductOrderByWithRelationInput =
        sort === 'price_asc'
            ? { price: 'asc' }
            : sort === 'price_desc'
                ? { price: 'desc' }
                : sort === 'popular'
                    ? { reviews: { _count: 'desc' } }
                    : { createdAt: 'desc' };

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy,
            include: {
                category: { select: { name: true, slug: true } },
                variants: true,
                reviews: { select: { rating: true } },
            },
        }),
        prisma.product.count({ where }),
    ]);

    return { products, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const getBySlug = async (slug: string) => {
    const product = await prisma.product.findUnique({
        where: { slug },
        include: {
            category: true,
            variants: true,
            reviews: {
                include: { user: { select: { name: true, avatar: true } } },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
    if (!product) throw createError('Product not found', 404);
    return product;
};

export const create = async (dto: CreateProductDto, imageBuffers: Buffer[]) => {
    const existing = await prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) throw createError('Slug already exists', 409);

    const images = imageBuffers.length > 0 ? await uploadImages(imageBuffers) : [];

    const { variants, ...productData } = dto;
    return prisma.product.create({
        data: {
            ...productData,
            images,
            variants: { create: variants },
        },
        include: { variants: true, category: true },
    });
};

export const update = async (id: string, dto: Partial<CreateProductDto>, imageBuffers?: Buffer[]) => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw createError('Product not found', 404);

    let images = product.images;
    if (imageBuffers && imageBuffers.length > 0) {
        images = await uploadImages(imageBuffers);
    }

    const { variants, ...productData } = dto;
    return prisma.product.update({
        where: { id },
        data: { ...productData, images },
        include: { variants: true, category: true },
    });
};

export const remove = async (id: string) => {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw createError('Product not found', 404);
    return prisma.product.update({ where: { id }, data: { isActive: false } });
};
