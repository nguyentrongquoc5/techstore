import { Router } from 'express';
import { Prisma } from '@prisma/client';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { prisma } from '../prisma.js';
import { mapProduct } from '../utils/map.js';
import { adminRequired } from '../middleware/auth.js';
import { z } from 'zod';
import { validate } from '../utils/validate.js';
import { BusinessError } from '../utils/errors.js';

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../public/images/products');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const name = crypto.randomBytes(16).toString('hex') + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 5 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      cb(new Error('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP'));
      return;
    }
    cb(null, true);
  },
});

const productBaseSchema = {
  name: z
    .string({ error: 'Tên sản phẩm không được để trống' })
    .trim()
    .min(1, 'Tên sản phẩm không được để trống')
    .max(200, 'Tên sản phẩm tối đa 200 ký tự'),
  categoryId: z
    .string({ error: 'Danh mục không hợp lệ' })
    .min(1, 'Danh mục không được để trống'),
  brand: z.string({ error: 'Thương hiệu không hợp lệ' }).default(''),
  price: z.coerce
    .number({ error: 'Giá không hợp lệ' })
    .int('Giá phải là số nguyên')
    .min(0, 'Giá không được âm'),
  salePrice: z
    .union([
      z.null(),
      z.literal(''),
      z.coerce.number().int('Giá KM phải là số nguyên').min(0, 'Giá KM không được âm'),
    ])
    .optional()
    .transform((value) => (value === '' || value === undefined ? null : value)),
  stock: z.coerce
    .number({ error: 'Tồn kho không hợp lệ' })
    .int('Tồn kho phải là số nguyên')
    .min(0, 'Tồn kho không được âm'),
  description: z.string().default(''),
  specs: z.record(z.string(), z.string()).optional().default({ 'Bảo hành': '12 tháng' }),
  images: z.array(z.string()).optional().default(['/images/products/placeholder.jpg']),
  isFeatured: z.boolean().optional().default(false),
  isBestSeller: z.boolean().optional().default(false),
  status: z.enum(['active', 'inactive'], { error: 'Trạng thái phải là active hoặc inactive' }).optional().default('active'),
  variants: z.array(z.object({
    id: z.string().optional(),
    color: z.string().trim().max(80).default(''),
    configuration: z.string().trim().max(120).default(''),
    sku: z.string().trim().min(1).max(100),
    price: z.union([z.null(), z.coerce.number().int().min(0)]).optional().default(null),
    stock: z.coerce.number().int().min(0),
    isActive: z.boolean().optional().default(true),
  })).max(100).refine((variants) => new Set(variants.map((variant) => variant.sku)).size === variants.length, {
    message: 'SKU biến thể không được trùng nhau',
  }).optional(),
};

const createProductSchema = z
  .object(productBaseSchema)
  .refine((data) => data.salePrice == null || data.salePrice < data.price, {
    message: 'Giá khuyến mãi phải nhỏ hơn giá gốc',
    path: ['salePrice'],
  });

const updateProductSchema = z
  .object({
    name: productBaseSchema.name.optional(),
    categoryId: productBaseSchema.categoryId.optional(),
    brand: productBaseSchema.brand.optional(),
    price: productBaseSchema.price.optional(),
    salePrice: productBaseSchema.salePrice,
    stock: productBaseSchema.stock.optional(),
    description: productBaseSchema.description.optional(),
    specs: productBaseSchema.specs.optional(),
    images: productBaseSchema.images.optional(),
    isFeatured: productBaseSchema.isFeatured.optional(),
    isBestSeller: productBaseSchema.isBestSeller.optional(),
    status: productBaseSchema.status.optional(),
    variants: productBaseSchema.variants,
  })
  .refine(
    (data) => data.salePrice == null || data.price == null || data.salePrice < data.price,
    { message: 'Giá khuyến mãi phải nhỏ hơn giá gốc', path: ['salePrice'] },
  );

router.get('/', async (req, res) => {
  const { q, category, brand, minPrice, maxPrice, sort, status } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 12));
  const skip = (page - 1) * limit;
  const where: Prisma.ProductWhereInput = {};
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

  const sortOptions: Record<string, Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[]> = {
    'name-asc': { name: 'asc' },
    'name-desc': { name: 'desc' },
    'price-asc': { price: 'asc' },
    'price-desc': { price: 'desc' },
    'stock-asc': { stock: 'asc' },
    'stock-desc': { stock: 'desc' },
    rating: { rating: 'desc' },
    bestseller: [{ isBestSeller: 'desc' }, { createdAt: 'desc' }],
    oldest: { createdAt: 'asc' },
    newest: { createdAt: 'desc' },
  };
  const orderBy = sortOptions[String(sort)] ?? sortOptions.newest;

  const [total, list] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, orderBy, skip, take: limit, include: { category: true, variants: true } }),
  ]);
  const items = list.map((p) => ({
    ...mapProduct(p),
    categoryName: p.category.name,
  }));
  res.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) || 1 });
});

router.get('/featured', async (_req, res) => {
  let list = await prisma.product.findMany({
    where: { isFeatured: true, status: 'active' },
    include: { category: true, variants: true },
    take: 12,
  });
  if (list.length === 0) {
    list = await prisma.product.findMany({
      where: { status: 'active' },
      include: { category: true, variants: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
    });
  }
  res.json(list.map((p) => ({ ...mapProduct(p), categoryName: p.category.name })));
});

router.get('/best-sellers', async (_req, res) => {
  let list = await prisma.product.findMany({
    where: { isBestSeller: true, status: 'active' },
    include: { category: true, variants: true },
    take: 12,
  });
  if (list.length === 0) {
    list = await prisma.product.findMany({
      where: { status: 'active' },
      include: { category: true, variants: true },
      orderBy: [{ rating: 'desc' }, { createdAt: 'desc' }],
      take: 12,
    });
  }
  res.json(list.map((p) => ({ ...mapProduct(p), categoryName: p.category.name })));
});

router.get('/brands', async (req, res) => {
  const category = req.query.category ? String(req.query.category) : undefined;
  const includeInactive = req.query.status === 'all';
  const rows = await prisma.product.findMany({
    where: {
      ...(!includeInactive && { status: 'active' }),
      brand: { not: '' },
      ...(category ? { categoryId: category } : {}),
    },
    select: { brand: true },
    distinct: ['brand'],
    orderBy: { brand: 'asc' },
  });

  res.json(rows.map((r) => r.brand).filter((brand) => brand.trim() !== ''));
});

/** Upload ảnh sản phẩm (admin) — đặt trước /:id */
router.post('/upload', adminRequired, (req, res) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'Mỗi ảnh tối đa 2MB' });
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ message: 'Tối đa 5 ảnh mỗi lần tải lên' });
      }
      return res.status(400).json({ message: err.message || 'Upload thất bại' });
    }
    if (err) {
      return res.status(400).json({ message: err.message || 'Upload thất bại' });
    }
    const files = (req.files as Express.Multer.File[]) || [];
    if (!files.length) {
      return res.status(400).json({ message: 'Chưa chọn ảnh nào' });
    }
    const paths = files.map((f) => `/images/products/${f.filename}`);
    res.json({ paths });
  });
});

router.get('/:id', async (req, res) => {
  const p = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { category: true, variants: true },
  });
  if (!p) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  res.json({ ...mapProduct(p), categoryName: p.category.name });
});

router.post('/', adminRequired, validate(createProductSchema), async (req, res) => {
  const body = req.body;
  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
  if (!category) {
    return res.status(400).json({ message: 'Danh mục không tồn tại' });
  }

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
      brand: body.brand,
      price: body.price,
      salePrice: body.salePrice,
      description: body.description,
      specs: JSON.stringify(body.specs),
      images: JSON.stringify(body.images),
      isFeatured: body.isFeatured,
      isBestSeller: body.isBestSeller,
      status: body.status,
      stock: body.variants?.length ? body.variants.reduce((total: number, variant: { stock: number }) => total + variant.stock, 0) : body.stock,
      ...(body.variants ? { variants: { create: body.variants.map(({ id: _id, ...variant }: { id?: string; color: string; configuration: string; sku: string; price: number | null; stock: number; isActive: boolean }) => variant) } } : {}),
    },
    include: { category: true, variants: true },
  });
  res.status(201).json({ ...mapProduct(p), categoryName: p.category.name });
});

router.put('/:id', adminRequired, validate(updateProductSchema), async (req, res) => {
  const body = req.body;
  if (body.categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
    if (!category) {
      return res.status(400).json({ message: 'Danh mục không tồn tại' });
    }
  }

  try {
    const data = {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId }),
        ...(body.brand !== undefined && { brand: body.brand }),
        ...(body.price !== undefined && { price: body.price }),
        ...(body.salePrice !== undefined && { salePrice: body.salePrice }),
        ...(body.variants?.length
          ? { stock: body.variants.reduce((total: number, variant: { stock: number }) => total + variant.stock, 0) }
          : body.stock !== undefined && { stock: body.stock }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.specs !== undefined && { specs: JSON.stringify(body.specs) }),
        ...(body.images !== undefined && { images: JSON.stringify(body.images) }),
        ...(body.isFeatured !== undefined && { isFeatured: body.isFeatured }),
        ...(body.isBestSeller !== undefined && { isBestSeller: body.isBestSeller }),
        ...(body.status !== undefined && { status: body.status }),
      };
    const p = await prisma.$transaction(async (tx) => {
      if (body.variants !== undefined) {
        const keptIds = body.variants.flatMap((variant: { id?: string }) => variant.id ? [variant.id] : []);
        await tx.productVariant.deleteMany({
          where: { productId: req.params.id, ...(keptIds.length ? { id: { notIn: keptIds } } : {}) },
        });
        for (const variant of body.variants) {
          const { id, ...variantData } = variant;
          if (id) {
            const result = await tx.productVariant.updateMany({
              where: { id, productId: req.params.id },
              data: variantData,
            });
            if (result.count !== 1) throw new BusinessError('Biến thể không thuộc sản phẩm này');
          } else {
            await tx.productVariant.create({ data: { ...variantData, productId: req.params.id } });
          }
        }
      }
      const product = await tx.product.update({
        where: { id: req.params.id },
        data,
        include: { category: true, variants: true },
      });
      return product;
    });
    res.json({ ...mapProduct(p), categoryName: p.category.name });
  } catch (error) {
    if (error instanceof BusinessError) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(409).json({ message: 'SKU biến thể đã được sử dụng' });
    }
    throw error;
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
