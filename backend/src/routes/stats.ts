import { Router } from 'express';
import { prisma } from '../prisma.js';
import { adminRequired } from '../middleware/auth.js';
import { mapOrder } from '../utils/map.js';

const router = Router();

router.get('/dashboard', adminRequired, async (_req, res) => {
  const [productCount, userCount, orders, products, categories] = await Promise.all([
    prisma.product.count(),
    prisma.user.count(),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.product.findMany({ where: { isBestSeller: true }, take: 5, include: { category: true } }),
    prisma.category.findMany({ include: { _count: { select: { products: true } } } }),
  ]);

  const revenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const byStatus: Record<string, number> = {};
  const byMonth: Record<string, number> = {};
  for (const o of orders) {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
    if (o.status !== 'cancelled') {
      const m = o.createdAt.toISOString().slice(0, 7);
      byMonth[m] = (byMonth[m] || 0) + o.total;
    }
  }

  res.json({
    totalRevenue: revenue,
    totalOrders: orders.length,
    totalProducts: productCount,
    totalUsers: userCount,
    revenueByMonth: Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, value]) => ({ month, revenue: value })),
    ordersByStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    bestSellers: products.map((p) => ({
      ...p,
      images: JSON.parse(p.images || '[]'),
      categoryName: p.category.name,
    })),
    categoryStats: categories.map((c) => ({ name: c.name, count: c._count.products })),
    recentOrders: orders.slice(0, 8).map(mapOrder),
  });
});

export default router;
