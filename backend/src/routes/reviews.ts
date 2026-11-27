import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = Router();

function orderHasProduct(itemsJson: string, productId: string): boolean {
  try {
    const items = JSON.parse(itemsJson || '[]') as { productId?: string }[];
    return Array.isArray(items) && items.some((item) => String(item?.productId) === productId);
  } catch {
    return false;
  }
}

router.get('/products/:id/reviews', async (req, res) => {
  const productId = String(req.params.id);
  const requestedPage = Number(req.query.page) || 1;
  const requestedLimit = Number(req.query.limit) || 10;
  if (!Number.isSafeInteger(requestedPage) || !Number.isSafeInteger(requestedLimit)) {
    return res.status(400).json({ message: 'Trang hoặc số lượng đánh giá không hợp lệ' });
  }
  const page = Math.max(1, requestedPage);
  const limit = Math.min(50, Math.max(1, requestedLimit));

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

  const [total, rows] = await Promise.all([
    prisma.review.count({ where: { productId } }),
    prisma.review.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { user: { select: { id: true, fullName: true } } },
    }),
  ]);

  res.json({
    items: rows.map((review) => ({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: review.user.fullName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    rating: product.rating,
    reviewCount: product.reviewCount,
  });
});

router.post('/products/:id/reviews', authRequired, async (req, res) => {
  const productId = String(req.params.id);
  const userId = req.user!.userId;
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment || '').trim();

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
  }
  if (comment.length > 2000) {
    return res.status(400).json({ message: 'Nội dung đánh giá tối đa 2000 ký tự' });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId } },
  });
  if (existing) return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });

  const orders = await prisma.order.findMany({ where: { userId, status: 'delivered' } });
  if (!orders.some((order) => orderHasProduct(order.items, productId))) {
    return res.status(403).json({
      message: 'Chỉ đánh giá được khi đã nhận hàng (đơn delivered) sản phẩm này',
    });
  }

  try {
    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: { productId, userId, rating, comment },
        include: { user: { select: { id: true, fullName: true } } },
      });
      const aggregate = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
        _count: { _all: true },
      });
      await tx.product.update({
        where: { id: productId },
        data: {
          rating: Number((aggregate._avg.rating ?? rating).toFixed(1)),
          reviewCount: aggregate._count._all,
        },
      });
      return created;
    });

    res.status(201).json({
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      userName: review.user.fullName,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }
    throw error;
  }
});

router.get('/reviews/my', authRequired, async (req, res) => {
  const reviews = await prisma.review.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { id: true, fullName: true } } },
  });
  res.json(reviews.map((review) => ({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: review.user.fullName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  })));
});

router.patch('/reviews/:id', authRequired, async (req, res) => {
  const rating = Number(req.body?.rating);
  const comment = String(req.body?.comment ?? '').trim();
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Điểm đánh giá phải từ 1 đến 5' });
  }
  if (comment.length > 2000) {
    return res.status(400).json({ message: 'Nội dung đánh giá tối đa 2000 ký tự' });
  }
  const id = String(req.params.id);
  const existing = await prisma.review.findUnique({ where: { id } });
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
  if (existing.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Bạn chỉ có thể sửa đánh giá của mình' });
  }

  const review = await prisma.$transaction(async (tx) => {
    const updated = await tx.review.update({
      where: { id },
      data: { rating, comment },
      include: { user: { select: { id: true, fullName: true } } },
    });
    const aggregate = await tx.review.aggregate({
      where: { productId: updated.productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await tx.product.update({
      where: { id: updated.productId },
      data: {
        rating: Number((aggregate._avg.rating ?? rating).toFixed(1)),
        reviewCount: aggregate._count._all,
      },
    });
    return updated;
  });
  res.json({
    id: review.id,
    productId: review.productId,
    userId: review.userId,
    userName: review.user.fullName,
    rating: review.rating,
    comment: review.comment,
    createdAt: review.createdAt,
  });
});

router.get('/reviews', adminRequired, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;
  const ratingRaw = req.query.rating;
  const rating = ratingRaw !== undefined && ratingRaw !== '' ? Number(ratingRaw) : undefined;
  const q = String(req.query.q || '').trim();
  const where: Prisma.ReviewWhereInput = {};

  if (rating !== undefined && Number.isInteger(rating) && rating >= 1 && rating <= 5) {
    where.rating = rating;
  }
  if (q) {
    where.OR = [
      { comment: { contains: q } },
      { product: { name: { contains: q } } },
      { user: { fullName: { contains: q } } },
      { user: { email: { contains: q } } },
    ];
  }

  const sortOptions: Record<string, Prisma.ReviewOrderByWithRelationInput> = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    'rating-asc': { rating: 'asc' },
    'rating-desc': { rating: 'desc' },
  };
  const orderBy = sortOptions[String(req.query.sort)] ?? sortOptions.newest;

  const [total, rows] = await Promise.all([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        product: { select: { id: true, name: true } },
      },
    }),
  ]);

  res.json({
    items: rows.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
      user: review.user,
      product: review.product,
    })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  });
});

router.delete('/reviews/:id', authRequired, async (req, res) => {
  const id = String(req.params.id);
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return res.status(404).json({ message: 'Không tìm thấy đánh giá' });
  if (review.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Bạn chỉ có thể xóa đánh giá của mình' });
  }
  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    const aggregate = await tx.review.aggregate({
      where: { productId: review.productId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    await tx.product.update({
      where: { id: review.productId },
      data: {
        rating: aggregate._count._all === 0 ? 0 : Number((aggregate._avg.rating ?? 0).toFixed(1)),
        reviewCount: aggregate._count._all,
      },
    });
  });
  res.json({ message: 'Đã xóa đánh giá' });
});

export default router;
