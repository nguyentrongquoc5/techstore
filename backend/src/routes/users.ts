import { Router } from 'express';
import { prisma } from '../prisma.js';
import { adminRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', adminRequired, async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(users.map(({ password, ...u }) => u));
});

/**
 * Admin khóa / mở khóa tài khoản (isActive).
 * Không cho tự khóa chính mình; không cho khóa tài khoản ADMIN khác.
 */
router.patch('/:id/status', adminRequired, async (req, res) => {
  const id = String(req.params.id);
  const body = req.body || {};
  if (typeof body.isActive !== 'boolean') {
    return res.status(400).json({ message: 'isActive phải là boolean' });
  }
  const isActive = body.isActive;

  // Không cho admin tự khóa / đổi trạng thái chính mình
  if (id === req.user!.userId) {
    return res.status(400).json({ message: 'Không thể khóa hoặc mở khóa tài khoản của chính mình' });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return res.status(404).json({ message: 'Không tìm thấy user' });
  }

  // Không cho khóa tài khoản ADMIN khác
  if (target.role === 'ADMIN' && isActive === false) {
    return res.status(400).json({ message: 'Không thể khóa tài khoản ADMIN khác' });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
    });
    const { password, ...safe } = user;
    res.json(safe);
  } catch {
    res.status(404).json({ message: 'Không tìm thấy user' });
  }
});

router.patch('/:id', adminRequired, async (req, res) => {
  const { role, isActive } = req.body || {};
  try {
    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
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