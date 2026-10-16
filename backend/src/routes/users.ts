import { Router } from 'express';
import { prisma } from '../prisma.js';
import { adminRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', adminRequired, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users.map(({ password, ...u }) => u));
});

router.patch('/:id', adminRequired, async (req, res) => {
  const { role, isActive } = req.body || {};
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: {
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      },
    });
    const { password, ...safe } = user;
    res.json(safe);
  } catch {
    res.status(404).json({ message: 'Không tìm thấy user' });
  }
});

export default router;
