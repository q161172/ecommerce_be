import { Request, Response } from 'express';
import * as usersService from './users.service';
import { z } from 'zod';

const addressSchema = z.object({
    fullName: z.string().min(2),
    phone: z.string().min(9),
    street: z.string().min(5),
    district: z.string().min(2),
    city: z.string().min(2),
    isDefault: z.boolean().default(false),
});

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    const data = await usersService.getProfile(req.user!.id);
    res.json({ success: true, data });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    const { name } = req.body;
    const file = req.file;
    const data = await usersService.updateProfile(req.user!.id, { name, avatar: file?.path });
    res.json({ success: true, data });
};

export const addAddress = async (req: Request, res: Response): Promise<void> => {
    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
    }
    const data = await usersService.addAddress(req.user!.id, parsed.data);
    res.status(201).json({ success: true, data });
};

export const updateAddress = async (req: Request, res: Response): Promise<void> => {
    const data = await usersService.updateAddress(req.user!.id, req.params.addressId, req.body);
    res.json({ success: true, data });
};

export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
    await usersService.deleteAddress(req.user!.id, req.params.addressId);
    res.status(204).send();
};

// Admin
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = req.query;
    const data = await usersService.getAllUsers(Number(page) || 1, Number(limit) || 20);
    res.json({ success: true, ...data });
};

export const toggleUserActive = async (req: Request, res: Response): Promise<void> => {
    const data = await usersService.toggleUserActive(req.params.id);
    res.json({ success: true, data });
};

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
    const { role } = req.body;
    const data = await usersService.changeUserRole(req.params.id, role);
    res.json({ success: true, data });
};
