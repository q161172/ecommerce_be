import { prisma } from '../../config/prisma';

export const getDashboardStats = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
        totalRevenue,
        monthRevenue,
        lastMonthRevenue,
        totalOrders,
        monthOrders,
        totalUsers,
        monthUsers,
        totalProducts,
        recentOrders,
        revenueByMonth,
        topProducts,
        ordersByStatus,
    ] = await Promise.all([
        // Total revenue (completed payments)
        prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),

        // This month revenue
        prisma.payment.aggregate({
            where: { status: 'COMPLETED', createdAt: { gte: startOfMonth } },
            _sum: { amount: true },
        }),

        // Last month revenue
        prisma.payment.aggregate({
            where: { status: 'COMPLETED', createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
            _sum: { amount: true },
        }),

        // Total orders
        prisma.order.count(),

        // This month orders
        prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),

        // Total users
        prisma.user.count({ where: { role: 'CUSTOMER' } }),

        // This month users
        prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: startOfMonth } } }),

        // Total active products
        prisma.product.count({ where: { isActive: true } }),

        // Recent orders
        prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                payment: { select: { status: true } },
            },
        }),

        // Revenue last 6 months (raw query for grouping)
        prisma.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT TO_CHAR(p."createdAt", 'YYYY-MM') as month, 
             SUM(p.amount)::float as revenue
      FROM payments p
      WHERE p.status = 'COMPLETED' 
        AND p."createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `,

        // Top selling products
        prisma.orderItem.groupBy({
            by: ['productId', 'productName'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        }),

        // Orders by status
        prisma.order.groupBy({
            by: ['status'],
            _count: { _all: true },
        }),
    ]);

    const monthRevenueVal = Number(monthRevenue._sum.amount ?? 0);
    const lastMonthRevenueVal = Number(lastMonthRevenue._sum.amount ?? 0);
    const revenueGrowth = lastMonthRevenueVal
        ? ((monthRevenueVal - lastMonthRevenueVal) / lastMonthRevenueVal) * 100
        : 0;

    return {
        kpis: {
            totalRevenue: Number(totalRevenue._sum.amount ?? 0),
            monthRevenue: monthRevenueVal,
            revenueGrowth: Math.round(revenueGrowth * 10) / 10,
            totalOrders,
            monthOrders,
            totalUsers,
            monthUsers,
            totalProducts,
        },
        recentOrders,
        revenueByMonth,
        topProducts,
        ordersByStatus,
    };
};
