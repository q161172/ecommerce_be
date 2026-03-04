import { Request, Response } from 'express';
import * as reviewsService from './reviews.service';
import { z } from 'zod';

const createSchema = z.object({
    rating: z.number().int().min(1).max(5),
    comment: z.string().optional(),
});

export const createReview = async (req: Request, res: Response): Promise<void> => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = await reviewsService.createReview(req.user!.id, req.params.productId, parsed.data);
    res.status(201).json({ success: true, data });
};

export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
    const data = await reviewsService.getProductReviews(req.params.productId);
    res.json({ success: true, data });
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
    await reviewsService.deleteReview(req.params.id, req.user!.id, req.user!.role === 'ADMIN');
    res.status(204).send();
};
