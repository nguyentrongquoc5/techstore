import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { adminRequired } from '../middleware/auth.js';
import { validate } from '../utils/validate.js';

const router = Router();

const createUserSchema = z.object({
  email: z.string().trim().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string().trim().min(1, 'Họ tên không được để trống').max(100),
  phone: z.string().trim().max(20).optional().default(''),
  role: z.enum(['USER', 'ADMIN']).optional().default('USER'),
});

router.get('/', adminRequired, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users.map(({ password, ...u }) => u));
});

router.post('/', adminRequired, validate(createUserSchema), async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: 'Email đã được sử dụng' });
  const password = await bcrypt.hash(req.body.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password,
      fullName: req.body.fullName,
      phone: req.body.phone,
      role: req.body.role,
    },
  });
  const { password: _password, ...safe } = user;
  res.status(201).json(safe);
});

router.patch('/:id', adminRequired, async (req, res) => {
  const id = String(req.params.id);
  const { role, isActive } = req.body || {};

  if (role !== undefined && role !== 'USER' && role !== 'ADMIN') {
    return res.status(400).json({ message: 'Role chỉ được là USER hoặc ADMIN' });
  }

  if (role !== undefined && req.user?.userId === id) {
    return res.status(400).json({ message: 'Không thể tự đổi role của chính mình' });
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive phải là boolean' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    const { password, ...safe } = user;
    res.json(safe);
  } catch {
    res.status(404).json({ message: 'Không tìm thấy user' });
  }
});

router.delete('/:id', adminRequired, async (req, res) => {
  const id = String(req.params.id);
  if (req.user?.userId === id) {
    return res.status(400).json({ message: 'Không thể xóa tài khoản đang đăng nhập' });
  }
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
  const orderCount = await prisma.order.count({ where: { userId: id } });
  if (orderCount > 0) {
    return res.status(409).json({ message: 'User đã có đơn hàng; hãy khóa tài khoản để bảo toàn lịch sử đơn' });
  }
  await prisma.user.delete({ where: { id } });
  res.json({ message: 'Đã xóa user' });
});

export default router;
