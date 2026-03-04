import { prisma } from '../../config/prisma';
import { cloudinary } from '../../config/cloudinary';
import { createError } from '../../middleware/errorHandler';

export interface CreateCategoryDto {
    name: string;
    slug: string;
    description?: string;
}

export const getAll = async () => {
    return prisma.category.findMany({
        where: { isActive: true },
        include: { _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
    });
};

export const getBySlug = async (slug: string) => {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) throw createError('Category not found', 404);
    return category;
};

export const create = async (dto: CreateCategoryDto, imageBuffer?: Buffer) => {
    const existing = await prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw createError('Slug already exists', 409);

    let imageUrl: string | undefined;
    if (imageBuffer) {
        const uploaded = await new Promise<string>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'selling-clothes/categories' },
                (err, result) => (err ? reject(err) : resolve(result!.secure_url))
            ).end(imageBuffer);
        });
        imageUrl = uploaded;
    }

    return prisma.category.create({ data: { ...dto, image: imageUrl } });
};

export const update = async (id: string, dto: Partial<CreateCategoryDto> & { removeImage?: boolean }, imageBuffer?: Buffer) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw createError('Category not found', 404);

    let imageUrl: string | null | undefined = category.image;

    if (imageBuffer) {
        // New image provided — upload to Cloudinary
        imageUrl = await new Promise<string>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
                { folder: 'selling-clothes/categories' },
                (err, result) => (err ? reject(err) : resolve(result!.secure_url))
            ).end(imageBuffer);
        });
    } else if (dto.removeImage) {
        // Explicit removal requested by client
        imageUrl = null;
    }

    const { removeImage: _remove, ...rest } = dto;
    return prisma.category.update({ where: { id }, data: { ...rest, image: imageUrl } });
};

export const remove = async (id: string) => {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) throw createError('Category not found', 404);
    return prisma.category.update({ where: { id }, data: { isActive: false } });
};
