import { Request, Response } from 'express';
import * as ordersService from './orders.service';
import { AuthRequest } from '../../middleware/authenticate';
import { z } from 'zod';

const createOrderSchema = z.object({
    addressId: z.string().cuid(),
    notes: z.string().optional(),
});

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = await ordersService.createOrder(req.user!.id, parsed.data);
    res.status(201).json({ success: true, data });
};

export const getMyOrders = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await ordersService.getUserOrders(req.user!.id);
    res.json({ success: true, data });
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
    const data = await ordersService.getOrderById(req.params.id, req.user!.id);
    res.json({ success: true, data });
};

// Admin
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
    const { page, limit, status } = req.query;
    const data = await ordersService.getAllOrders(Number(page) || 1, Number(limit) || 20, status as string);
    res.json({ success: true, ...data });
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
    const { status } = req.body;
    const data = await ordersService.updateOrderStatus(req.params.id, status);
    res.json({ success: true, data });
};
