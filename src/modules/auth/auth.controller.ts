import { Request, Response } from 'express';
import * as authService from './auth.service';
import { z } from 'zod';
import { AuthRequest } from '../../middleware/authenticate';
import { env } from '../../config/env';
import { generateTokensForUser } from './auth.service';
import { prisma } from '../../config/prisma';

const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const registerSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export const register = async (req: Request, res: Response): Promise<void> => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
    }

    const { user, accessToken, refreshToken } = await authService.register(parsed.data);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(201).json({ success: true, data: { user, accessToken } });
};

export const login = async (req: Request, res: Response): Promise<void> => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ message: 'Validation error', errors: parsed.error.flatten().fieldErrors });
        return;
    }

    const { user, accessToken, refreshToken } = await authService.login(parsed.data);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ success: true, data: { user, accessToken } });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    const token = req.cookies?.refreshToken;
    if (!token) {
        res.status(401).json({ message: 'No refresh token' });
        return;
    }

    const tokens = await authService.refresh(token);
    res.cookie('refreshToken', tokens.refreshToken, REFRESH_COOKIE_OPTIONS);
    res.status(200).json({ success: true, data: { accessToken: tokens.accessToken } });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    if (req.user) {
        await authService.logout(req.user.id);
    }
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out successfully' });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
    const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { id: true, email: true, name: true, role: true, avatar: true, createdAt: true },
    });
    res.status(200).json({ success: true, data: user });
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as { id: string; email: string; role: string };
    const { accessToken, refreshToken } = generateTokensForUser(user);

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTIONS);
    // Redirect to frontend with access token in query param (FE reads it once and stores)
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${accessToken}`);
};
