import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../config/prisma';
import { env } from '../../config/env';
import { createError } from '../../middleware/errorHandler';

export interface RegisterDto {
    name: string;
    email: string;
    password: string;
}

export interface LoginDto {
    email: string;
    password: string;
}

const signAccessToken = (payload: { id: string; email: string; role: string }) =>
    jwt.sign(payload, env.ACCESS_TOKEN_SECRET, { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

const signRefreshToken = (payload: { id: string }) =>
    jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn'] });

export const register = async (dto: RegisterDto) => {
    const existing = await prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw createError('Email already in use', 409);

    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await prisma.user.create({
        data: { ...dto, password: hashed, role: 'CUSTOMER' },
        select: { id: true, email: true, name: true, role: true, avatar: true },
    });

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    return { user, accessToken, refreshToken };
};

export const login = async (dto: LoginDto) => {
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.password) throw createError('Invalid email or password', 401);
    if (!user.isActive) throw createError('Account is deactivated', 403);

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw createError('Invalid email or password', 401);

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });

    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

    return {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar },
        accessToken,
        refreshToken,
    };
};

export const refresh = async (token: string) => {
    let decoded: { id: string };
    try {
        decoded = jwt.verify(token, env.REFRESH_TOKEN_SECRET) as { id: string };
    } catch {
        throw createError('Invalid refresh token', 401);
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.refreshToken !== token) throw createError('Invalid refresh token', 401);
    if (!user.isActive) throw createError('Account is deactivated', 403);

    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const newRefreshToken = signRefreshToken({ id: user.id });

    // Refresh token rotation
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

    return { accessToken, refreshToken: newRefreshToken };
};

export const logout = async (userId: string) => {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
};

export const generateTokensForUser = (user: { id: string; email: string; role: string }) => {
    const accessToken = signAccessToken({ id: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ id: user.id });
    return { accessToken, refreshToken };
};
