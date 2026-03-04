import { Response } from 'express';
import { getDashboardStats } from './admin.service';
import { AuthRequest } from '../../middleware/authenticate';

export const getStats = async (_req: AuthRequest, res: Response): Promise<void> => {
    const data = await getDashboardStats();
    res.json({ success: true, data });
};
