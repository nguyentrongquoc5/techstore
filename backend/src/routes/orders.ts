import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';
import { mapOrder } from '../utils/map.js';
import { isValidStatusTransition, statusTransitionError } from '../utils/orderStatus.js';
import { validate } from '../utils/validate.js';
import { assertCouponUsable } from './coupons.js';
import { BusinessError, notFound, forbidden } from '../utils/errors.js';
import { restoreOrderStock } from '../utils/orderStock.js';
import { sendOrderConfirmation } from '../services/orderEmail.js';

const router = Router();

/** Phí ship: miễn phí nếu tạm tính > 5.000.000đ (cùng rule frontend) */
const FREE_SHIP_THRESHOLD = 5_000_000;
const SHIPPING_FEE = 30_000;

const vnPhoneRegex = /^(0|\+84)[0-9]{9,10}$/;

const shippingInfoSchema = z.object({
  fullName: z
    .string({ error: 'Họ tên không được để trống' })
    .trim()
    .min(1, 'Họ tên không được để trống'),
  address: z
    .string({ error: 'Địa chỉ không được để trống' })
    .trim()
    .min(1, 'Địa chỉ không được để trống'),
  city: z
    .string({ error: 'Tỉnh/Thành phố không được để trống' })
    .trim()
    .min(1, 'Tỉnh/Thành phố không được để trống'),
  district: z
    .string({ error: 'Quận/Huyện không được để trống' })
    .trim()
    .min(1, 'Quận/Huyện không được để trống'),
  phone: z
    .string({ error: 'Số điện thoại không hợp lệ' })
    .trim()
    .regex(vnPhoneRegex, 'Số điện thoại không hợp lệ (bắt đầu bằng 0 hoặc +84, 10-11 chữ số)'),
  email: z
    .string({ error: 'Email không hợp lệ' })
    .trim()
    .email('Email không hợp lệ'),
  note: z
    .string()
    .max(500, 'Ghi chú tối đa 500 ký tự')
    .optional()
    .default(''),
});

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().min(1).optional(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1, 'Giỏ hàng trống'),
  shippingInfo: shippingInfoSchema,
  paymentMethod: z.enum(['cod', 'transfer', 'vnpay', 'momo']).optional().default('cod'),
  couponCode: z.string().optional(),
});

const updatePaymentSchema = z.object({
  paymentStatus: z.enum(['paid', 'unpaid'], {
    error: 'Trạng thái thanh toán không hợp lệ',
  }),
});

router.get('/my', authRequired, async (req, res) => {
  const list = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: 'desc' },
    include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
  });
  res.json(list.map(mapOrder));
});

router.get('/', adminRequired, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;
  const statusFilter = String(req.query.status || '').trim();
  const paymentStatusFilter = String(req.query.paymentStatus || '').trim();
  const paymentMethodFilter = String(req.query.paymentMethod || '').trim();
  const q = String(req.query.q || '').trim();
  const allowedStatuses = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
  const allowedPaymentStatuses = ['paid', 'unpaid'];
  const allowedPaymentMethods = ['cod', 'transfer', 'vnpay', 'momo'];
  const where: Prisma.OrderWhereInput = {};

  if (statusFilter && allowedStatuses.includes(statusFilter)) {
    where.status = statusFilter;
  }
  if (allowedPaymentStatuses.includes(paymentStatusFilter)) {
    where.paymentStatus = paymentStatusFilter;
  }
  if (allowedPaymentMethods.includes(paymentMethodFilter)) {
    where.paymentMethod = paymentMethodFilter;
  }
  if (q) {
    where.OR = [
      { userName: { contains: q } },
      { userEmail: { contains: q } },
      { id: { contains: q } },
    ];
  }

  const sortOptions: Record<string, Prisma.OrderOrderByWithRelationInput> = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    'total-asc': { total: 'asc' },
    'total-desc': { total: 'desc' },
    'customer-asc': { userName: 'asc' },
    'customer-desc': { userName: 'desc' },
  };
  const orderBy = sortOptions[String(req.query.sort)] ?? sortOptions.newest;

  const [total, list] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where, orderBy, skip, take: limit,
      include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
    }),
  ]);
  res.json({ items: list.map(mapOrder), total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
});

router.get('/:id', authRequired, async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: String(req.params.id) },
    include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
  });
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
router.post('/', authRequired, validate(createOrderSchema), async (req, res) => {
  const body = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(401).json({ message: 'Chưa đăng nhập' });

  const rawItems: { productId: string; variantId?: string; quantity: number }[] = body.items;

  // Gom số lượng theo productId (tránh trùng dòng)
  const qtyMap = new Map<string, { productId: string; variantId?: string; quantity: number }>();
  for (const it of rawItems) {
    const id = String(it.productId || '').trim();
    const variantId = typeof it.variantId === 'string' ? it.variantId.trim() : undefined;
    const qty = Number(it.quantity);
    if (!id || !Number.isSafeInteger(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Mỗi sản phẩm cần productId và quantity > 0' });
    }
    const key = `${id}:${variantId || ''}`;
    const existing = qtyMap.get(key);
    qtyMap.set(key, { productId: id, variantId, quantity: (existing?.quantity || 0) + Math.floor(qty) });
  }

  const productIds = [...new Set([...qtyMap.values()].map((item) => item.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { variants: true },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  // Kiểm tra tồn tại / trạng thái / tồn kho (trước khi vào transaction)
  const orderItems: {
    productId: string;
    productName: string;
    productImage: string;
    variantId?: string;
    variantName?: string;
    price: number;
    quantity: number;
  }[] = [];

  for (const { productId, variantId, quantity } of qtyMap.values()) {
    const p = productById.get(productId);
    if (!p) {
      return res.status(400).json({ message: `Không tìm thấy sản phẩm: ${productId}` });
    }
    if (p.status !== 'active') {
      return res.status(400).json({ message: `Sản phẩm "${p.name}" đang ngừng bán` });
    }
    const variant = variantId ? p.variants.find((entry) => entry.id === variantId) : undefined;
    if (p.variants.length && !variant) {
      return res.status(400).json({ message: `Vui lòng chọn biến thể cho sản phẩm "${p.name}"` });
    }
    if (variantId && (!variant || !variant.isActive)) {
      return res.status(400).json({ message: `Biến thể của sản phẩm "${p.name}" không khả dụng` });
    }
    const availableStock = variant?.stock ?? p.stock;
    if (availableStock < quantity) {
      return res.status(400).json({
        message: `Sản phẩm "${p.name}" chỉ còn ${availableStock} trong kho (bạn chọn ${quantity})`,
      });
    }

    // Giá lấy từ DB, ưu tiên salePrice
    const unitPrice = variant?.price ?? (p.salePrice != null ? p.salePrice : p.price);
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
      ...(variant && {
        variantId: variant.id,
        variantName: [variant.color, variant.configuration].filter(Boolean).join(' · ') || variant.sku,
      }),
      price: unitPrice,
      quantity,
    });
  }

  // Server tự tính tiền
  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingFee = subtotal > FREE_SHIP_THRESHOLD || subtotal === 0 ? 0 : SHIPPING_FEE;
  const couponCode = String(body.couponCode || '').trim().toUpperCase();
  let discount = 0;
  let couponId: string | null = null;
  if (couponCode) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode } });
    const result = assertCouponUsable(coupon, subtotal);
    if (!result.ok) return res.status(400).json({ message: result.message });
    discount = result.discount;
    couponId = coupon!.id;
  }
  const total = Math.max(0, subtotal - discount + shippingFee);

  const shippingInfo = body.shippingInfo;
  const paymentMethod = body.paymentMethod;

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Trong transaction: kiểm tra lại tồn kho (tránh race) rồi trừ
      for (const item of orderItems) {
        const updated = item.variantId
          ? await tx.productVariant.updateMany({
              where: {
                id: item.variantId,
                productId: item.productId,
                isActive: true,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            })
          : await tx.product.updateMany({
              where: {
                id: item.productId,
                stock: { gte: item.quantity },
                status: 'active',
              },
              data: { stock: { decrement: item.quantity } },
            });
        if (updated.count === 0) {
          throw new BusinessError(
            `Không đủ tồn kho cho sản phẩm "${item.productName}" (có thể vừa bị đặt hết)`
          );
        }
        if (item.variantId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      if (couponId) {
        const coupon = await tx.coupon.findUnique({ where: { id: couponId } });
        const result = assertCouponUsable(coupon, subtotal);
        if (!result.ok || result.discount !== discount) {
          throw new BusinessError(result.ok ? 'Mã giảm giá đã thay đổi, vui lòng áp dụng lại' : result.message);
        }

        const updated = await tx.coupon.updateMany({
          where: {
            id: couponId,
            isActive: true,
            AND: [
              { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
              ...(coupon!.usageLimit == null ? [] : [{ usedCount: { lt: coupon!.usageLimit! } }]),
            ],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (updated.count !== 1) {
          throw new BusinessError('Mã giảm giá đã hết lượt sử dụng hoặc hết hạn');
        }
      }

      const created = await tx.order.create({
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
          couponCode: couponCode || null,
          shippingInfo: JSON.stringify(shippingInfo),
        },
      });
      await tx.orderStatusLog.create({ data: { orderId: created.id, status: 'pending', changedBy: user.id } });
      return tx.order.findUniqueOrThrow({
        where: { id: created.id }, include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
      });
    });

    let emailSent = false;
    try {
      emailSent = await sendOrderConfirmation({
        ...mapOrder(order),
        shippingInfo: mapOrder(order).shippingInfo,
      });
    } catch (error) {
      console.error(`[OrderEmail] Không gửi được xác nhận cho đơn ${order.id}`, error);
    }
    res.status(201).json({ ...mapOrder(order), emailSent });
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return res.status(err.status).json({ message: err.message });
    }
    throw err;
  }
});

router.patch('/:id/payment', adminRequired, validate(updatePaymentSchema), async (req, res) => {
  try {
    const id = String(req.params.id);
    const { paymentStatus } = req.body as { paymentStatus: 'paid' | 'unpaid' };

    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id } });
      if (!current) throw notFound('Không tìm thấy đơn');
      if (current.status === 'cancelled') {
        throw new BusinessError('Không thể đổi trạng thái thanh toán của đơn đã hủy');
      }

      await tx.order.update({
        where: { id },
        data: {
          paymentStatus,
          paidAt: paymentStatus === 'paid' ? new Date() : null,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id },
        include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
      });
    });

    res.json(mapOrder(order));
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return res.status(err.status).json({ message: err.message });
    }
    throw err;
  }
});

router.patch('/:id/status', adminRequired, async (req, res) => {
  const status = String(req.body?.status || '');
  const allowed = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
  try {
    const id = String(req.params.id);
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id } });
      if (!current) throw notFound('Không tìm thấy đơn');
      if (!isValidStatusTransition(current.status, status)) {
        throw new BusinessError(statusTransitionError(current.status, status));
      }
      if (status === current.status) return tx.order.findUniqueOrThrow({
        where: { id }, include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
      });
      if (status === 'cancelled') {
        await restoreOrderStock(tx, current);
      }
      const data: Prisma.OrderUpdateInput = { status };
      if (status === 'delivered' && current.paymentMethod === 'cod') {
        data.paymentStatus = 'paid';
        data.paidAt = new Date();
      }
      await tx.order.update({ where: { id }, data });
      await tx.orderStatusLog.create({ data: { orderId: id, status, changedBy: req.user!.userId } });
      return tx.order.findUniqueOrThrow({
        where: { id }, include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
      });
    });
    res.json(mapOrder(order));
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return res.status(err.status).json({ message: err.message });
    }
    throw err;
  }
});

/** User hủy đơn của mình */
router.post('/:id/cancel', authRequired, async (req, res) => {
  const id = String(req.params.id);
  try {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id } });
      if (!current) throw notFound('Không tìm thấy đơn');
      if (current.userId !== req.user!.userId && req.user!.role !== 'ADMIN') {
        throw forbidden('Không có quyền');
      }
      if (!['pending', 'processing'].includes(current.status)) {
        throw new BusinessError(
          current.status === 'cancelled'
            ? 'Đơn đã được hủy trước đó'
            : 'Chỉ hủy được đơn đang chờ xác nhận hoặc đang xử lý',
        );
      }
      if (current.paymentStatus === 'paid') {
        throw new BusinessError('Đơn đã thanh toán; vui lòng liên hệ hỗ trợ để được hoàn tiền');
      }
      await restoreOrderStock(tx, current);
      await tx.order.update({ where: { id }, data: { status: 'cancelled' } });
      await tx.orderStatusLog.create({ data: { orderId: id, status: 'cancelled', changedBy: req.user!.userId } });
      return tx.order.findUniqueOrThrow({
        where: { id }, include: { statusLogs: { orderBy: { createdAt: 'asc' } } },
      });
    });
    res.json(mapOrder(order));
  } catch (err: unknown) {
    if (err instanceof BusinessError) {
      return res.status(err.status).json({ message: err.message });
    }
    throw err;
  }
});

export default router;
