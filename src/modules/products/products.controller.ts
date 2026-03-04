import { Request, Response } from 'express';
import * as productsService from './products.service';
import { z } from 'zod';

const variantSchema = z.object({
    size: z.string(),
    color: z.string(),
    stock: z.number().int().min(0),
    sku: z.string(),
});

const createSchema = z.object({
    name: z.string().min(2),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    description: z.string().min(10),
    price: z.coerce.number().positive(),
    comparePrice: z.coerce.number().positive().optional(),
    categoryId: z.string().cuid(),
    isFeatured: z.coerce.boolean().optional(),
    variants: z.array(variantSchema).min(1),
});

export const getAll = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, categoryId, search, minPrice, maxPrice, featured, sort } = req.query;
    const data = await productsService.getAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        categoryId: categoryId as string,
        search: search as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
        sort: sort as 'price_asc' | 'price_desc' | 'newest' | 'popular',
    });
    res.json({ success: true, ...data });
};

export const getBySlug = async (req: Request, res: Response): Promise<void> => {
    const data = await productsService.getBySlug(req.params.slug);
    res.json({ success: true, data });
};

export const create = async (req: Request, res: Response): Promise<void> => {
    const body = { ...req.body, variants: JSON.parse(req.body.variants ?? '[]') };
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const files = (req.files as Express.Multer.File[]) ?? [];
    const data = await productsService.create(parsed.data, files.map((f) => f.buffer));
    res.status(201).json({ success: true, data });
};

export const update = async (req: Request, res: Response): Promise<void> => {
    const files = (req.files as Express.Multer.File[]) ?? [];
    const body = { ...req.body };
    if (body.variants) body.variants = JSON.parse(body.variants);
    if (body.price) body.price = Number(body.price);
    const data = await productsService.update(req.params.id, body, files.map((f) => f.buffer));
    res.json({ success: true, data });
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    await productsService.remove(req.params.id);
    res.status(204).send();
};
