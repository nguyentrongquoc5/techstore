import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { mapOrder } from '../utils/map.js';

const router = Router();

router.get('/my', authRequired, async (req, res) => {
  const list = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(list.map(mapOrder));
});

router.get('/', adminRequired, async (_req, res) => {
  const list = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(list.map(mapOrder));
});

router.get('/:id', authRequired, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn' });
  if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.userId) {
    return res.status(403).json({ message: 'Không có quyền' });
  }
  res.json(mapOrder(order));
});

router.post('/', authRequired, async (req, res) => {
  const body = req.body || {};
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(401).json({ message: 'Chưa đăng nhập' });

  const items = body.items || [];
  if (!items.length) return res.status(400).json({ message: 'Giỏ hàng trống' });

  const order = await prisma.order.create({
    data: {
      userId: user.id,
      userName: body.shippingInfo?.fullName || user.fullName,
      userEmail: body.shippingInfo?.email || user.email,
      items: JSON.stringify(items),
      subtotal: Number(body.subtotal) || 0,
      discount: Number(body.discount) || 0,
      shippingFee: Number(body.shippingFee) || 0,
      total: Number(body.total) || 0,
      status: 'pending',
      paymentMethod: body.paymentMethod || 'cod',
      shippingInfo: JSON.stringify(body.shippingInfo || {}),
    },
  });

  // trừ tồn kho
  for (const item of items) {
    if (item.productId && item.quantity) {
      await prisma.product
        .update({
          where: { id: item.productId },
          data: { stock: { decrement: Number(item.quantity) } },
        })
        .catch(() => null);
    }
  }

  res.status(201).json(mapOrder(order));
});

router.patch('/:id/status', adminRequired, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  try {
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(mapOrder(order));
  } catch {
    res.status(404).json({ message: 'Không tìm thấy đơn' });
  }
});

export default router;
