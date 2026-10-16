import { Router } from 'express';
import { prisma } from '../prisma.js';
import { mapProduct } from '../utils/map.js';
import { adminRequired } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, sort, status } = req.query;
  const where: any = {};
  if (status && status !== 'all') where.status = String(status);
  else if (!status) where.status = 'active';
  // status=all => no filter
  if (category) where.categoryId = String(category);
  if (brand) where.brand = String(brand);
  if (q) {
    where.OR = [
      { name: { contains: String(q) } },
      { brand: { contains: String(q) } },
      { description: { contains: String(q) } },
    ];
  }
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice);
    if (maxPrice) where.price.lte = Number(maxPrice);
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price-asc') orderBy = { price: 'asc' };
  if (sort === 'price-desc') orderBy = { price: 'desc' };
  if (sort === 'rating') orderBy = { rating: 'desc' };

  const list = await prisma.product.findMany({
    where,
    orderBy,
    include: { category: true },
  });

  let result = list.map((p) => ({
    ...mapProduct(p),
    categoryName: p.category.name,
  }));

  if (sort === 'bestseller') {
    result = result.sort((a, b) => Number(b.isBestSeller) - Number(a.isBestSeller));
  }

  res.json(result);
});

router.get('/featured', async (_req, res) => {
  const list = await prisma.product.findMany({
    where: { isFeatured: true, status: 'active' },
    include: { category: true },
    take: 12,
  });
  res.json(list.map((p) => ({ ...mapProduct(p), categoryName: p.category.name })));
});

router.get('/best-sellers', async (_req, res) => {
  const list = await prisma.product.findMany({
    where: { isBestSeller: true, status: 'active' },
    include: { category: true },
    take: 12,
  });
  res.json(list.map((p) => ({ ...mapProduct(p), categoryName: p.category.name })));
});

router.get('/:id', async (req, res) => {
  const p = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true },
  });
  if (!p) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json({ ...mapProduct(p), categoryName: p.category.name });
});

router.post('/', adminRequired, async (req, res) => {
  const body = req.body || {};
  const slug =
    String(body.name || 'sp')
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now();
  const p = await prisma.product.create({
    data: {
      name: body.name,
      slug,
      categoryId: body.categoryId,
      brand: body.brand || '',
      price: Number(body.price) || 0,
      salePrice: body.salePrice ? Number(body.salePrice) : null,
      stock: Number(body.stock) || 0,
      description: body.description || '',
      specs: JSON.stringify(body.specs || { 'Bảo hành': '12 tháng' }),
      images: JSON.stringify(body.images || ['/images/products/placeholder.jpg']),
      isFeatured: !!body.isFeatured,
      isBestSeller: !!body.isBestSeller,
      status: body.status || 'active',
    },
    include: { category: true },
  });
  res.status(201).json({ ...mapProduct(p), categoryName: p.category.name });
});

router.put('/:id', adminRequired, async (req, res) => {
  const body = req.body || {};
  try {
    const p = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.price !== undefined && { price: Number(body.price) }),
        ...(body.salePrice !== undefined && {
          salePrice: body.salePrice === null || body.salePrice === '' ? null : Number(body.salePrice),
        }),
        ...(body.stock !== undefined && { stock: Number(body.stock) }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.specs !== undefined && { specs: JSON.stringify(body.specs) }),
        ...(body.images !== undefined && { images: JSON.stringify(body.images) }),
        ...(body.isFeatured !== undefined && { isFeatured: !!body.isFeatured }),
        ...(body.isBestSeller !== undefined && { isBestSeller: !!body.isBestSeller }),
        ...(body.status !== undefined && { status: body.status }),
      },
      include: { category: true },
    });
    res.json({ ...mapProduct(p), categoryName: p.category.name });
  } catch {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }
});

router.delete('/:id', adminRequired, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Đã xóa' });
  } catch {
    res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }
});

export default router;
