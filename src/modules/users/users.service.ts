import { prisma } from '../../config/prisma';
import { createError } from '../../middleware/errorHandler';

export const getProfile = async (userId: string) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, avatar: true, role: true, createdAt: true, addresses: true },
    });
    if (!user) throw createError('User not found', 404);
    return user;
};

export const updateProfile = async (userId: string, data: { name?: string; avatar?: string }) => {
    return prisma.user.update({ where: { id: userId }, data, select: { id: true, email: true, name: true, avatar: true } });
};

export const addAddress = async (userId: string, data: {
    fullName: string; phone: string; street: string; district: string; city: string; isDefault: boolean;
}) => {
    if (data.isDefault) {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.create({ data: { userId, ...data } });
};

export const updateAddress = async (userId: string, addressId: string, data: Partial<{
    fullName: string; phone: string; street: string; district: string; city: string; isDefault: boolean;
}>) => {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw createError('Address not found', 404);
    if (data.isDefault) {
        await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.address.update({ where: { id: addressId }, data });
};

export const deleteAddress = async (userId: string, addressId: string) => {
    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) throw createError('Address not found', 404);
    return prisma.address.delete({ where: { id: addressId } });
};

// Admin
export const getAllUsers = async (page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
        prisma.user.findMany({
            skip,
            take: limit,
            select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, _count: { select: { orders: true } } },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count(),
    ]);
    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
};

export const toggleUserActive = async (id: string) => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw createError('User not found', 404);
    return prisma.user.update({ where: { id }, data: { isActive: !user.isActive } });
};

export const changeUserRole = async (id: string, role: 'ADMIN' | 'CUSTOMER') => {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw createError('User not found', 404);
    return prisma.user.update({ where: { id }, data: { role }, select: { id: true, email: true, role: true } });
};
