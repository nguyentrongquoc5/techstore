import { Router } from 'express';
import { prisma } from '../prisma.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = Router();

function normalizeCode(code: unknown): string {
  return String(code || '')
    .trim()
    .toUpperCase();
}

function parseExpiry(value: unknown): Date | null | undefined {
  if (value == null || value === '') return null;
  const raw = String(value);
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59.999Z`)
    : new Date(raw);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** Tính số tiền giảm từ coupon + subtotal (server-side) */
export function calcCouponDiscount(
  coupon: {
    type: string;
    value: number;
    maxDiscount: number | null;
  },
  subtotal: number
): number {
  if (subtotal <= 0) return 0;
  if (coupon.type === 'percent') {
    let discount = Math.floor((subtotal * coupon.value) / 100);
    if (coupon.maxDiscount != null) {
      discount = Math.min(discount, coupon.maxDiscount);
    }
    return Math.min(discount, subtotal);
  }
  // fixed
  return Math.min(coupon.value, subtotal);
}

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: Date | null;
  isActive: boolean;
};

/** Kiểm tra coupon có dùng được không; trả message tiếng Việt nếu lỗi */
export function assertCouponUsable(
  coupon: CouponRow | null,
  subtotal: number
): { ok: true; discount: number } | { ok: false; message: string } {
  if (!coupon) {
    return { ok: false, message: 'Mã giảm giá không tồn tại' };
  }
  if (!coupon.isActive) {
    return { ok: false, message: 'Mã giảm giá đã bị vô hiệu hóa' };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { ok: false, message: 'Mã giảm giá đã hết hạn' };
  }
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: 'Mã giảm giá đã hết lượt sử dụng' };
  }
  if (subtotal < coupon.minOrder) {
    return {
      ok: false,
      message: `Đơn hàng tối thiểu ${coupon.minOrder.toLocaleString('vi-VN')}đ để dùng mã này`,
    };
  }
  if (coupon.type !== 'percent' && coupon.type !== 'fixed') {
    return { ok: false, message: 'Loại mã giảm giá không hợp lệ' };
  }
  const discount = calcCouponDiscount(coupon, subtotal);
  if (discount <= 0) {
    return { ok: false, message: 'Mã giảm giá không áp dụng được cho đơn này' };
  }
  return { ok: true, discount };
}

// POST /api/coupons/validate — user đã đăng nhập
router.post('/validate', authRequired, async (req, res) => {
  const code = normalizeCode(req.body?.code);
  const subtotal = Number(req.body?.subtotal);

  if (!code) {
    return res.status(400).json({ message: 'Vui lòng nhập mã giảm giá' });
  }
  if (!Number.isSafeInteger(subtotal) || subtotal < 0) {
    return res.status(400).json({ message: 'Subtotal không hợp lệ' });
  }

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  const result = assertCouponUsable(coupon, subtotal);
  if (!result.ok) {
    return res.status(400).json({ message: result.message });
  }

  res.json({
    code: coupon!.code,
    type: coupon!.type,
    value: coupon!.value,
    discount: result.discount,
    minOrder: coupon!.minOrder,
    maxDiscount: coupon!.maxDiscount,
  });
});

// Admin CRUD
router.get('/', adminRequired, async (_req, res) => {
  const list = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(list);
});

router.post('/', adminRequired, async (req, res) => {
  const body = req.body || {};
  const code = normalizeCode(body.code);
  const type = String(body.type || '');
  const value = Number(body.value);
  const minOrder = body.minOrder != null ? Number(body.minOrder) : 0;
  const maxDiscount =
    body.maxDiscount != null && body.maxDiscount !== ''
      ? Number(body.maxDiscount)
      : null;
  const usageLimit =
    body.usageLimit != null && body.usageLimit !== ''
      ? Number(body.usageLimit)
      : null;
  const expiresAt = parseExpiry(body.expiresAt);
  const isActive = body.isActive !== false && body.isActive !== 'false';

  if (!code) {
    return res.status(400).json({ message: 'Thiếu mã giảm giá' });
  }
  if (type !== 'percent' && type !== 'fixed') {
    return res.status(400).json({ message: "type phải là 'percent' hoặc 'fixed'" });
  }
  if (!Number.isSafeInteger(value) || value <= 0) {
    return res.status(400).json({ message: 'Giá trị giảm phải > 0' });
  }
  if (type === 'percent' && value > 100) {
    return res.status(400).json({ message: 'Phần trăm giảm tối đa 100' });
  }
  if (!Number.isSafeInteger(minOrder) || minOrder < 0) {
    return res.status(400).json({ message: 'minOrder không hợp lệ' });
  }
  if (maxDiscount != null && (!Number.isSafeInteger(maxDiscount) || maxDiscount < 0 || type !== 'percent')) {
    return res.status(400).json({ message: 'maxDiscount chỉ hợp lệ với mã phần trăm và phải >= 0' });
  }
  if (usageLimit != null && (!Number.isSafeInteger(usageLimit) || usageLimit < 0)) {
    return res.status(400).json({ message: 'usageLimit phải là số nguyên không âm' });
  }
  if (expiresAt === undefined) {
    return res.status(400).json({ message: 'expiresAt không hợp lệ' });
  }

  try {
    const coupon = await prisma.coupon.create({
      data: {
        code,
        type,
        value: Math.floor(value),
        minOrder: Math.floor(minOrder),
        maxDiscount,
        usageLimit,
        expiresAt,
        isActive,
      },
    });
    res.status(201).json(coupon);
  } catch {
    res.status(400).json({ message: 'Mã giảm giá đã tồn tại hoặc dữ liệu không hợp lệ' });
  }
});

router.put('/:id', adminRequired, async (req, res) => {
  const id = String(req.params.id);
  const body = req.body || {};

  const data: Record<string, unknown> = {};

  if (body.code !== undefined) {
    const code = normalizeCode(body.code);
    if (!code) return res.status(400).json({ message: 'Mã giảm giá không được trống' });
    data.code = code;
  }
  if (body.type !== undefined) {
    if (body.type !== 'percent' && body.type !== 'fixed') {
      return res.status(400).json({ message: "type phải là 'percent' hoặc 'fixed'" });
    }
    data.type = body.type;
  }
  if (body.value !== undefined) {
    const value = Number(body.value);
    if (!Number.isSafeInteger(value) || value <= 0) {
      return res.status(400).json({ message: 'Giá trị giảm phải > 0' });
    }
    data.value = Math.floor(value);
  }
  if (body.minOrder !== undefined) {
    const minOrder = Number(body.minOrder);
    if (!Number.isSafeInteger(minOrder) || minOrder < 0) {
      return res.status(400).json({ message: 'minOrder không hợp lệ' });
    }
    data.minOrder = Math.floor(minOrder);
  }
  if (body.maxDiscount !== undefined) {
    if (body.maxDiscount === null || body.maxDiscount === '') {
      data.maxDiscount = null;
    } else {
      const maxDiscount = Number(body.maxDiscount);
      if (!Number.isSafeInteger(maxDiscount) || maxDiscount < 0) {
        return res.status(400).json({ message: 'maxDiscount không hợp lệ' });
      }
      data.maxDiscount = Math.floor(maxDiscount);
    }
  }
  if (body.usageLimit !== undefined) {
    if (body.usageLimit === null || body.usageLimit === '') {
      data.usageLimit = null;
    } else {
      const usageLimit = Number(body.usageLimit);
      if (!Number.isSafeInteger(usageLimit) || usageLimit < 0) {
        return res.status(400).json({ message: 'usageLimit không hợp lệ' });
      }
      data.usageLimit = Math.floor(usageLimit);
    }
  }
  if (body.expiresAt !== undefined) {
    const expiresAt = parseExpiry(body.expiresAt);
    if (expiresAt === undefined) return res.status(400).json({ message: 'expiresAt không hợp lệ' });
    data.expiresAt = expiresAt;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive phải là boolean' });
    }
    data.isActive = body.isActive;
  }

  const current = await prisma.coupon.findUnique({ where: { id } });
  if (!current) return res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
  const nextType = (data.type as string | undefined) ?? current.type;
  const nextValue = (data.value as number | undefined) ?? current.value;
  if (nextType === 'percent' && nextValue > 100) {
    return res.status(400).json({ message: 'Phần trăm giảm tối đa 100' });
  }
  const nextMaxDiscount = (data.maxDiscount as number | null | undefined) ?? current.maxDiscount;
  if (nextType !== 'percent' && nextMaxDiscount != null) {
    return res.status(400).json({ message: 'maxDiscount chỉ áp dụng cho mã phần trăm' });
  }

  try {
    const coupon = await prisma.coupon.update({ where: { id }, data });
    res.json(coupon);
  } catch {
    res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
  }
});

router.delete('/:id', adminRequired, async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: String(req.params.id) } });
    res.json({ message: 'Đã xóa' });
  } catch {
    res.status(404).json({ message: 'Không tìm thấy mã giảm giá' });
  }
});

export default router;
