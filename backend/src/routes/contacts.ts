import { Router } from 'express';
import type { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { adminRequired } from '../middleware/auth.js';
import { validate } from '../utils/validate.js';

const router = Router();

const createContactSchema = z.object({
  fullName: z.string().trim().min(1, 'Vui lòng nhập họ tên').max(120),
  email: z.string().trim().email('Email không hợp lệ').max(254),
  message: z.string().trim().min(1, 'Vui lòng nhập nội dung').max(5000, 'Nội dung tối đa 5000 ký tự'),
});

router.post('/', validate(createContactSchema), async (req, res) => {
  const contact = await prisma.contact.create({ data: req.body });
  res.status(201).json({ id: contact.id, message: 'Đã gửi liên hệ thành công' });
});

router.get('/', adminRequired, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;
  const q = String(req.query.q || '').trim();
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  const where: Prisma.ContactWhereInput = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q } },
      { email: { contains: q } },
      { message: { contains: q } },
    ];
  }
  const createdAt: Prisma.DateTimeFilter = {};
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) {
    const date = new Date(`${from}T00:00:00.000Z`);
    if (!Number.isNaN(date.getTime())) createdAt.gte = date;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    const date = new Date(`${to}T23:59:59.999Z`);
    if (!Number.isNaN(date.getTime())) createdAt.lte = date;
  }
  if (Object.keys(createdAt).length > 0) where.createdAt = createdAt;
  const sortOptions: Record<string, Prisma.ContactOrderByWithRelationInput> = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    'name-asc': { fullName: 'asc' },
    'name-desc': { fullName: 'desc' },
  };
  const orderBy = sortOptions[String(req.query.sort)] ?? sortOptions.newest;
  const [total, items] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({ where, orderBy, skip, take: limit }),
  ]);
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
});

export default router;
