import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { authRequired, signToken } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  if (!user.isActive) return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

router.post('/register', async (req, res) => {
  const { email, password, fullName, phone } = req.body || {};
  if (!email || !password || !fullName) return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
  const exists = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (exists) return res.status(400).json({ message: 'Email đã được sử dụng' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: String(email).toLowerCase(),
      password: hash,
      fullName,
      phone: phone || '',
      role: 'USER',
    },
  });
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const { password: _, ...safe } = user;
  res.status(201).json({ token, user: safe });
});

router.get('/me', authRequired, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

router.put('/profile', authRequired, async (req, res) => {
  const { fullName, phone, address, city, district } = req.body || {};
  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(district !== undefined && { district }),
    },
  });
  const { password: _, ...safe } = user;
  res.json(safe);
});

router.put('/password', authRequired, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
  const ok = await bcrypt.compare(oldPassword || '', user.password);
  if (!ok) return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
  res.json({ message: 'Đổi mật khẩu thành công' });
});

export default router;
