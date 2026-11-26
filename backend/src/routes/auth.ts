import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authRequired, signToken } from '../middleware/auth.js';
import { validate } from '../utils/validate.js';
import { VN_PHONE_REGEX } from '../utils/phone.js';
import { getFrontendOrigins } from '../utils/config.js';

const router = Router();

/** Rate limit cho các endpoint auth nhạy cảm. Tắt khi NODE_ENV=test. */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau 15 phút' },
  skip: () => process.env.NODE_ENV === 'test',
});

const loginSchema = z.object({
  email: z.string({ error: 'Email không hợp lệ' }).trim().email('Email không hợp lệ'),
  password: z.string({ error: 'Vui lòng nhập mật khẩu' }).min(1, 'Vui lòng nhập mật khẩu'),
});

const registerSchema = z.object({
  email: z.string({ error: 'Email không hợp lệ' }).trim().email('Email không hợp lệ'),
  password: z.string({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  fullName: z.string({ error: 'Họ tên không được để trống' }).min(1, 'Họ tên không được để trống'),
  phone: z.string().trim().regex(VN_PHONE_REGEX, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
});

const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống').optional(),
  phone: z.string().trim().regex(VN_PHONE_REGEX, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  district: z.string().optional(),
});

const passwordSchema = z.object({
  oldPassword: z.string({ error: 'Vui lòng nhập mật khẩu cũ' }).min(1, 'Vui lòng nhập mật khẩu cũ'),
  newPassword: z.string({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' }).min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

const forgotPasswordSchema = z.object({
  email: z.string({ error: 'Email không hợp lệ' }).email('Email không hợp lệ'),
});

const resetPasswordSchema = z.object({
  token: z.string({ error: 'Thiếu token đặt lại mật khẩu' }).min(1, 'Thiếu token đặt lại mật khẩu'),
  password: z.string({ error: 'Mật khẩu phải có ít nhất 6 ký tự' }).min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

router.post('/login', authLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
  if (!user) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  if (!user.isActive) return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  const { password: _, ...safe } = user;
  res.json({ token, user: safe });
});

router.post('/register', authLimiter, validate(registerSchema), async (req, res) => {
  const { email, password, fullName, phone } = req.body;
  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (exists) return res.status(400).json({ message: 'Email đã được sử dụng' });
  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
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

router.put('/profile', authRequired, validate(profileSchema), async (req, res) => {
  const { fullName, phone, address, city, district } = req.body;
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

router.put('/password', authRequired, validate(passwordSchema), async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
  if (!user) return res.status(404).json({ message: 'Không tìm thấy user' });
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hash } });
  res.json({ message: 'Đổi mật khẩu thành công' });
});

/** Quên mật khẩu — luôn trả thông báo chung, không lộ email có tồn tại hay không */
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), async (req, res) => {
  const email = String(req.body.email).trim().toLowerCase();
  const genericMessage =
    'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.';

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    return res.json({ message: genericMessage });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 phút

  await prisma.passwordReset.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const frontendUrl = getFrontendOrigins()[0];
  const resetLink = `${frontendUrl}/dat-lai-mat-khau?token=${token}`;
  console.log(`[PasswordReset] Link đặt lại mật khẩu cho ${email}: ${resetLink}`);

  const payload: { message: string; resetToken?: string } = { message: genericMessage };
  if (process.env.EXPOSE_RESET_TOKEN === 'true') {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[PasswordReset] Bỏ qua EXPOSE_RESET_TOKEN=true trong môi trường production.');
    } else {
      payload.resetToken = token;
    }
  }
  res.json(payload);
});

/** Đặt lại mật khẩu bằng token */
router.post('/reset-password', validate(resetPasswordSchema), async (req, res) => {
  const token = String(req.body.token).trim();
  const password = String(req.body.password);

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
    return res.status(400).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });
  }

  const hash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hash } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  res.json({ message: 'Đặt lại mật khẩu thành công' });
});

export default router;
