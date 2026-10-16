import { Router } from 'express';
import { prisma } from '../prisma.js';
import { adminRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', async (_req, res) => {
  const cats = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: 'asc' },
  });
  res.json(
    cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      productCount: c._count.products,
    }))
  );
});

router.post('/', adminRequired, async (req, res) => {
  const { name, description } = req.body || {};
  if (!name) return res.status(400).json({ message: 'Thiếu tên danh mục' });
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '');
  const c = await prisma.category.create({
    data: { name, slug: `${slug}-${Date.now()}`, description: description || '' },
  });
  res.status(201).json({ ...c, productCount: 0 });
});

router.put('/:id', adminRequired, async (req, res) => {
  const { name, description } = req.body || {};
  try {
    const c = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
      },
      include: { _count: { select: { products: true } } },
    });
    res.json({ ...c, productCount: c._count.products });
  } catch {
    res.status(404).json({ message: 'Không tìm thấy danh mục' });
  }
});

router.delete('/:id', adminRequired, async (req, res) => {
  try {
    await prisma.product.deleteMany({ where: { categoryId: req.params.id } });
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa' });
  } catch {
    res.status(404).json({ message: 'Không tìm thấy danh mục' });
  }
});

export default router;
