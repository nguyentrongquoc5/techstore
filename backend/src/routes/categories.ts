import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { adminRequired } from '../middleware/auth.js';
import { validate } from '../utils/validate.js';

const router = Router();

const createCategorySchema = z.object({
  name: z
    .string({ error: 'Tên danh mục không được để trống' })
    .trim()
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục tối đa 100 ký tự'),
  description: z
    .string()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional()
    .default(''),
});

const updateCategorySchema = z.object({
  name: z
    .string({ error: 'Tên danh mục không được để trống' })
    .trim()
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục tối đa 100 ký tự')
    .optional(),
  description: z
    .string()
    .max(500, 'Mô tả tối đa 500 ký tự')
    .optional(),
});

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

router.post('/', adminRequired, validate(createCategorySchema), async (req, res) => {
  const { name, description } = req.body;
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '');
  const c = await prisma.category.create({
    data: { name, slug: `${slug}-${Date.now()}`, description },
  });
  res.status(201).json({ ...c, productCount: 0 });
});

router.put('/:id', adminRequired, validate(updateCategorySchema), async (req, res) => {
  const { name, description } = req.body;
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
  const category = await prisma.category.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { products: true } } },
  });

  if (!category) {
    return res.status(404).json({ message: 'Không tìm thấy danh mục' });
  }

  const productCount = category._count.products;
  if (productCount > 0) {
    return res.status(400).json({
      message: `Danh mục còn ${productCount} sản phẩm, hãy chuyển hoặc xóa sản phẩm trước`,
    });
  }

  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ message: 'Đã xóa' });
});

export default router;
