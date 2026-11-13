import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { mapOrder } from '../utils/map.js';

const router = Router();

/** Phí ship: miễn phí nếu tạm tính > 5.000.000đ (cùng rule frontend) */
const FREE_SHIP_THRESHOLD = 5_000_000;
const SHIPPING_FEE = 30_000;

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
  const order = await prisma.order.findUnique({ where: { id: String(req.params.id) } });
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn' });
  if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.userId) {
    return res.status(403).json({ message: 'Không có quyền' });
  }
  res.json(mapOrder(order));
});

/**
 * Đặt hàng: server tự lấy giá từ DB, kiểm tra tồn kho, tính subtotal / ship / total,
 * trừ kho trong transaction — không tin số tiền client gửi lên.
 */
router.post('/', authRequired, async (req, res) => {
  const body = req.body || {};
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(401).json({ message: 'Chưa đăng nhập' });

  const rawItems: { productId?: string; quantity?: number }[] = body.items || [];
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return res.status(400).json({ message: 'Giỏ hàng trống' });
  }

  // Gom số lượng theo productId (tránh trùng dòng)
  const qtyMap = new Map<string, number>();
  for (const it of rawItems) {
    const id = String(it.productId || '').trim();
    const qty = Number(it.quantity);
    if (!id || !Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Mỗi sản phẩm cần productId và quantity > 0' });
    }
    qtyMap.set(id, (qtyMap.get(id) || 0) + Math.floor(qty));
  }

  const productIds = [...qtyMap.keys()];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  // Kiểm tra tồn tại / trạng thái / tồn kho (trước khi vào transaction)
  const orderItems: {
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
  }[] = [];

  for (const [productId, quantity] of qtyMap) {
    const p = productById.get(productId);
    if (!p) {
      return res.status(400).json({ message: `Không tìm thấy sản phẩm: ${productId}` });
    }
    if (p.status !== 'active') {
      return res.status(400).json({ message: `Sản phẩm "${p.name}" đang ngừng bán` });
    }
    if (p.stock < quantity) {
      return res.status(400).json({
        message: `Sản phẩm "${p.name}" chỉ còn ${p.stock} trong kho (bạn chọn ${quantity})`,
      });
    }

    // Giá lấy từ DB, ưu tiên salePrice
    const unitPrice = p.salePrice != null ? p.salePrice : p.price;
    let images: string[] = [];
    try {
      images = JSON.parse(p.images || '[]');
    } catch {
      images = [];
    }

    orderItems.push({
      productId: p.id,
      productName: p.name,
      productImage: images[0] || '',
      price: unitPrice,
      quantity,
    });
  }

  // Server tự tính tiền
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = 0;
  const shippingFee = subtotal > FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const total = subtotal - discount + shippingFee;

  const shippingInfo = body.shippingInfo || {};
  const paymentMethod = body.paymentMethod === 'transfer' ? 'transfer' : 'cod';

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Trong transaction: kiểm tra lại tồn kho (tránh race) rồi trừ
      for (const item of orderItems) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            stock: { gte: item.quantity },
            status: 'active',
          },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          throw new Error(
            `Không đủ tồn kho cho sản phẩm "${item.productName}" (có thể vừa bị đặt hết)`
          );
        }
      }

      return tx.order.create({
        data: {
          userId: user.id,
          userName: shippingInfo.fullName || user.fullName,
          userEmail: shippingInfo.email || user.email,
          items: JSON.stringify(orderItems),
          subtotal,
          discount,
          shippingFee,
          total,
          status: 'pending',
          paymentMethod,
          shippingInfo: JSON.stringify(shippingInfo),
        },
      });
    });

    res.status(201).json(mapOrder(order));
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Đặt hàng thất bại';
    // Lỗi tồn kho / nghiệp vụ → 400; lỗi khác → 500
    const isStock = message.includes('tồn kho') || message.includes('Không đủ');
    res.status(isStock ? 400 : 500).json({ message });
  }
});

/**
 * Khách (hoặc ADMIN) hủy đơn pending và hoàn lại tồn kho.
 */
router.patch('/:id/cancel', authRequired, async (req, res) => {
  const id = String(req.params.id);
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn' });

  // Chỉ chủ đơn hoặc ADMIN
  if (req.user!.role !== 'ADMIN' && order.userId !== req.user!.userId) {
    return res.status(403).json({ message: 'Không có quyền hủy đơn này' });
  }

  // Chỉ hủy khi đang pending
  if (order.status !== 'pending') {
    return res.status(400).json({
      message: 'Chỉ có thể hủy đơn đang ở trạng thái chờ xử lý (pending)',
    });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Đọc items từ JSON string
      let items: { productId?: string; quantity?: number }[] = [];
      try {
        items = JSON.parse(order.items || '[]');
      } catch {
        items = [];
      }

      // Cộng lại stock từng sản phẩm
      for (const item of items) {
        const productId = String(item.productId || '').trim();
        const qty = Number(item.quantity);
        if (!productId || !Number.isFinite(qty) || qty <= 0) continue;
        await tx.product.updateMany({
          where: { id: productId },
          data: { stock: { increment: Math.floor(qty) } },
        });
      }

      return tx.order.update({
        where: { id },
        data: { status: 'cancelled' },
      });
    });

    res.json(mapOrder(updated));
  } catch {
    res.status(500).json({ message: 'Hủy đơn thất bại' });
  }
});

router.patch('/:id/status', adminRequired, async (req, res) => {
  const { status } = req.body || {};
  const allowed = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  try {
    const order = await prisma.order.update({
      where: { id: String(req.params.id) },
      data: { status },
    });
    res.json(mapOrder(order));
  } catch {
    res.status(404).json({ message: 'Không tìm thấy đơn' });
  }
});

export default router;