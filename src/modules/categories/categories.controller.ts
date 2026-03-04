import { Request, Response } from 'express';
import * as categoriesService from './categories.service';
import { z } from 'zod';

const createSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
});

export const getAll = async (_req: Request, res: Response): Promise<void> => {
    const data = await categoriesService.getAll();
    res.json({ success: true, data });
};

export const getBySlug = async (req: Request, res: Response): Promise<void> => {
    const data = await categoriesService.getBySlug(req.params.slug);
    res.json({ success: true, data });
};

export const create = async (req: Request, res: Response): Promise<void> => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const file = req.file;
    const data = await categoriesService.create(parsed.data, file?.buffer);
    res.status(201).json({ success: true, data });
};

export const update = async (req: Request, res: Response): Promise<void> => {
    const file = req.file;
    const data = await categoriesService.update(req.params.id, req.body, file?.buffer);
    res.json({ success: true, data });
};

export const remove = async (req: Request, res: Response): Promise<void> => {
    await categoriesService.remove(req.params.id);
    res.status(204).send();
};
