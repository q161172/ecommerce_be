import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

// AuthRequest is now just Request (user field is globally augmented in src/types/express.d.ts)
export type AuthRequest = Request;

export const authenticate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Unauthorized: No token provided' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET) as {
            id: string;
            email: string;
            role: string;
        };

        const user = await prisma.user.findUnique({
            where: { id: decoded.id, isActive: true },
            select: { id: true, email: true, role: true },
        });

        if (!user) {
            res.status(401).json({ message: 'Unauthorized: User not found or inactive' });
            return;
        }

        req.user = user;
        next();
    } catch {
        res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};
