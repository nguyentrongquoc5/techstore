import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authRequired } from '../middleware/auth.js';
import { mapProduct } from '../utils/map.js';

const router = Router();

/** GET /api/wishlist — danh sách sản phẩm đã thích */
router.get('/', authRequired, async (req, res) => {
  const list = await prisma.wishlist.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: { product: { include: { category: true } } },
  });
  const items = list
    .filter((w) => w.product)
    .map((w) => ({
      ...mapProduct(w.product),
      categoryName: w.product.category?.name || '',
    }));
  res.json(items);
});

/** POST /api/wishlist/:productId — thêm vào yêu thích (idempotent) */
router.post('/:productId', authRequired, async (req, res) => {
  const productId = String(req.params.productId);
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });

  await prisma.wishlist.upsert({
    where: {
      userId_productId: { userId: req.user!.userId, productId },
    },
    create: { userId: req.user!.userId, productId },
    update: {},
  });
  res.json({ message: 'Đã thêm vào yêu thích' });
});

/** DELETE /api/wishlist/:productId — bỏ thích */
router.delete('/:productId', authRequired, async (req, res) => {
  const productId = String(req.params.productId);
  await prisma.wishlist.deleteMany({
    where: { userId: req.user!.userId, productId },
  });
  res.json({ message: 'Đã bỏ yêu thích' });
});

export default router;
