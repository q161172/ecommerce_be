import { Request, Response } from 'express';
import * as cartService from './cart.service';
import { z } from 'zod';

const addItemSchema = z.object({
    productId: z.string().cuid(),
    variantId: z.string().cuid(),
    quantity: z.number().int().positive(),
});

export const getCart = async (req: Request, res: Response): Promise<void> => {
    const data = await cartService.getCart(req.user!.id);
    res.json({ success: true, data });
};

export const addItem = async (req: Request, res: Response): Promise<void> => {
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = await cartService.addItem(req.user!.id, parsed.data.productId, parsed.data.variantId, parsed.data.quantity);
    res.status(201).json({ success: true, data });
};

export const updateItem = async (req: Request, res: Response): Promise<void> => {
    const { quantity } = req.body;
    const data = await cartService.updateItem(req.user!.id, req.params.itemId, Number(quantity));
    res.json({ success: true, data });
};

export const removeItem = async (req: Request, res: Response): Promise<void> => {
    await cartService.removeItem(req.user!.id, req.params.itemId);
    res.status(204).send();
};

export const clearCart = async (req: Request, res: Response): Promise<void> => {
    await cartService.clearCart(req.user!.id);
    res.status(204).send();
};
