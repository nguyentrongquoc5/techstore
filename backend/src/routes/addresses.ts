import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { authRequired } from '../middleware/auth.js';
import { validate } from '../utils/validate.js';

const router = Router();

const addressSchema = z.object({
  label: z.string().trim().min(1).max(50).default('Nhà riêng'),
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().regex(/^(0|\+84)[0-9]{9,10}$/, 'Số điện thoại không hợp lệ'),
  address: z.string().trim().min(1).max(300),
  district: z.string().trim().min(1).max(100),
  city: z.string().trim().min(1).max(100),
  isDefault: z.boolean().optional().default(false),
});

router.get('/', authRequired, async (req, res) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.userId },
    orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
  });
  res.json(addresses);
});

router.post('/', authRequired, validate(addressSchema), async (req, res) => {
  const userId = req.user!.userId;
  const address = await prisma.$transaction(async (tx) => {
    const hasAddresses = await tx.address.count({ where: { userId } });
    const isDefault = req.body.isDefault || hasAddresses === 0;
    if (isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { ...req.body, userId, isDefault },
    });
  });
  res.status(201).json(address);
});

router.put('/:id', authRequired, validate(addressSchema), async (req, res) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });

  const address = await prisma.$transaction(async (tx) => {
    if (req.body.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id },
      data: { ...req.body, isDefault: req.body.isDefault || existing.isDefault },
    });
  });
  res.json(address);
});

router.delete('/:id', authRequired, async (req, res) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const existing = await prisma.address.findFirst({ where: { id, userId } });
  if (!existing) return res.status(404).json({ message: 'Không tìm thấy địa chỉ' });

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id } });
    if (existing.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  res.json({ message: 'Đã xóa địa chỉ' });
});

export default router;
