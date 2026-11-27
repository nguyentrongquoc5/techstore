import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../app.js';
import { prisma } from '../prisma.js';

describe('TechStore API', () => {
  let adminToken = '';
  let userToken = '';
  let productId = '';

  beforeAll(async () => {
    await prisma.orderStatusLog.deleteMany();
    await prisma.review.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.coupon.deleteMany();
    await prisma.user.deleteMany();

    const passwordHash = await bcrypt.hash('test1234', 10);
    const admin = await prisma.user.create({
      data: { email: 'admin@test.com', password: passwordHash, fullName: 'Admin Test', role: 'ADMIN', isActive: true },
    });
    const user = await prisma.user.create({
      data: { email: 'user@test.com', password: passwordHash, fullName: 'User Test', role: 'USER', isActive: true },
    });
    await prisma.user.create({
      data: { email: 'locked@test.com', password: passwordHash, fullName: 'Locked User', role: 'USER', isActive: false },
    });

    const category = await prisma.category.create({ data: { name: 'Test Cat', slug: 'test-cat', description: '' } });
    const product = await prisma.product.create({
      data: {
        name: 'Test Phone', slug: 'test-phone', categoryId: category.id, brand: 'Test', price: 1_000_000,
        salePrice: 900_000, stock: 2, status: 'active',
        images: JSON.stringify(['/images/products/placeholder.jpg']), specs: JSON.stringify({}),
      },
    });
    productId = product.id;

    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'test1234' });
    adminToken = adminLogin.body.token;
    const userLogin = await request(app).post('/api/auth/login').send({ email: 'user@test.com', password: 'test1234' });
    userToken = userLogin.body.token;

    expect(admin.id).toBeTruthy();
    expect(user.id).toBeTruthy();
    expect(adminToken).toBeTruthy();
    expect(userToken).toBeTruthy();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('đăng ký thành công', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'newuser@test.com', password: 'test1234', fullName: 'New User',
    });
    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.email).toBe('newuser@test.com');
  });

  it('đăng nhập thành công', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'user@test.com', password: 'test1234' });
    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
  });

  it('đăng nhập được khi email có khoảng trắng thừa', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: ' user@test.com ',
      password: 'test1234',
    });
    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('user@test.com');
  });

  it('liệt kê thương hiệu duy nhất của sản phẩm active và lọc theo danh mục', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const otherCategory = await prisma.category.create({
      data: { name: 'Other Cat', slug: 'brands-test-other-cat' },
    });
    const testProducts = [
      { name: 'Brand Test Apple', slug: 'brands-test-apple', categoryId: category.id, brand: 'Apple', price: 100 },
      { name: 'Brand Test Apple Duplicate', slug: 'brands-test-apple-duplicate', categoryId: category.id, brand: 'Apple', price: 100 },
      { name: 'Brand Test Hidden', slug: 'brands-test-hidden', categoryId: category.id, brand: 'Hidden', price: 100, status: 'inactive' },
      { name: 'Brand Test Empty', slug: 'brands-test-empty', categoryId: category.id, brand: '', price: 100 },
      { name: 'Brand Test Whitespace', slug: 'brands-test-whitespace', categoryId: category.id, brand: '   ', price: 100 },
      { name: 'Brand Test Other Category', slug: 'brands-test-other-category', categoryId: otherCategory.id, brand: 'Other', price: 100 },
    ];

    try {
      await prisma.product.createMany({ data: testProducts });

      const allBrands = await request(app).get('/api/products/brands');
      expect(allBrands.status).toBe(200);
      expect(allBrands.body).toEqual(['Apple', 'Other', 'Test']);

      const adminBrands = await request(app).get('/api/products/brands?status=all');
      expect(adminBrands.status).toBe(200);
      expect(adminBrands.body).toEqual(['Apple', 'Hidden', 'Other', 'Test']);

      const categoryBrands = await request(app).get(`/api/products/brands?category=${category.id}`);
      expect(categoryBrands.status).toBe(200);
      expect(categoryBrands.body).toEqual(['Apple', 'Test']);
    } finally {
      await prisma.product.deleteMany({ where: { slug: { startsWith: 'brands-test-' } } });
      await prisma.category.delete({ where: { id: otherCategory.id } });
    }
  });

  it('lọc và sắp xếp danh sách sản phẩm theo bộ lọc quản trị', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const slugs = ['admin-filter-alpha', 'admin-filter-beta'];
    await prisma.product.createMany({
      data: [
        { name: 'Admin Filter Alpha', slug: slugs[0], categoryId: category.id, brand: 'FilterBrand', price: 500, stock: 5 },
        { name: 'Admin Filter Beta', slug: slugs[1], categoryId: category.id, brand: 'FilterBrand', price: 200, stock: 10 },
      ],
    });

    try {
      const response = await request(app)
        .get(`/api/products?status=all&category=${category.id}&brand=FilterBrand&q=Admin%20Filter&minPrice=100&maxPrice=600&sort=stock-desc&limit=2`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(2);
      expect(response.body.items.map((product: { name: string }) => product.name)).toEqual([
        'Admin Filter Beta',
        'Admin Filter Alpha',
      ]);
    } finally {
      await prisma.product.deleteMany({ where: { slug: { in: slugs } } });
    }
  });

  it('register thiếu fullName trả 400', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'novalid@test.com', password: 'test1234',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/họ tên|fullName|không được để trống/i);
  });

  it('register mật khẩu ngắn trả 400', async () => {
    const response = await request(app).post('/api/auth/register').send({
      email: 'shortpw@test.com', password: '123', fullName: 'Short',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/mật khẩu.*6/i);
  });

  it('login email không hợp lệ trả 400', async () => {
    const response = await request(app).post('/api/auth/login').send({
      email: 'khong-phai-email', password: 'test1234',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/email/i);
  });

  it('admin tạo sản phẩm với salePrice null và giá trị mặc định', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sản phẩm kiểm thử',
        categoryId: category.id,
        price: 100_000,
        salePrice: null,
        stock: 0,
      });

    expect(response.status).toBe(201);
    expect(response.body.salePrice).toBeNull();
    expect(response.body.specs).toEqual({ 'Bảo hành': '12 tháng' });
    expect(response.body.images).toEqual(['/images/products/placeholder.jpg']);
  });

  it('API sản phẩm từ chối dữ liệu không hợp lệ và danh mục không tồn tại', async () => {
    const category = await prisma.category.findFirstOrThrow();
    const invalidProduct = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: ' ',
        categoryId: category.id,
        price: 100_000,
        salePrice: 100_000,
        stock: 0,
      });
    expect(invalidProduct.status).toBe(400);

    const missingCategory = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Sản phẩm kiểm thử',
        categoryId: 'missing-category',
        price: 100_000,
        salePrice: null,
        stock: 0,
      });
    expect(missingCategory.status).toBe(400);
    expect(missingCategory.body.message).toMatch(/danh mục không tồn tại/i);
  });

  it('admin cập nhật sản phẩm với salePrice null và từ chối giá khuyến mãi không hợp lệ', async () => {
    const clearSalePrice = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ salePrice: null });
    expect(clearSalePrice.status).toBe(200);
    expect(clearSalePrice.body.salePrice).toBeNull();

    const invalidPrice = await request(app)
      .put(`/api/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ price: 800_000, salePrice: 900_000 });
    expect(invalidPrice.status).toBe(400);
  });

  it('API danh mục validate dữ liệu và hỗ trợ cập nhật từng phần', async () => {
    const invalidName = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '   ' });
    expect(invalidName.status).toBe(400);

    const invalidDescription = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Danh mục kiểm thử', description: 'x'.repeat(501) });
    expect(invalidDescription.status).toBe(400);

    const created = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '  Danh mục kiểm thử  ' });
    expect(created.status).toBe(201);
    expect(created.body.name).toBe('Danh mục kiểm thử');
    expect(created.body.description).toBe('');

    const invalidUpdate = await request(app)
      .put(`/api/categories/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: ' ' });
    expect(invalidUpdate.status).toBe(400);

    const partialUpdate = await request(app)
      .put(`/api/categories/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ description: 'Mô tả mới' });
    expect(partialUpdate.status).toBe(200);
    expect(partialUpdate.body.name).toBe('Danh mục kiểm thử');
    expect(partialUpdate.body.description).toBe('Mô tả mới');
  });

  it('không xóa danh mục còn sản phẩm và xóa được danh mục rỗng', async () => {
    const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
    const category = await prisma.category.findUniqueOrThrow({ where: { id: product.categoryId } });
    const productCount = await prisma.product.count({ where: { categoryId: category.id } });
    const blockedDelete = await request(app)
      .delete(`/api/categories/${category.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(blockedDelete.status).toBe(400);
    expect(blockedDelete.body.message).toContain(`còn ${productCount} sản phẩm`);
    expect(await prisma.product.findUnique({ where: { id: productId } })).not.toBeNull();

    const emptyCategory = await prisma.category.create({
      data: { name: 'Empty category', slug: `empty-${Date.now()}` },
    });
    const deleted = await request(app)
      .delete(`/api/categories/${emptyCategory.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(deleted.status).toBe(200);
    expect(await prisma.category.findUnique({ where: { id: emptyCategory.id } })).toBeNull();
  });

  it('forgot-password thiếu email trả 400', async () => {
    const response = await request(app).post('/api/auth/forgot-password').send({});
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/email/i);
  });

  it('chỉ trả reset token khi được bật ngoài production', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalExposeResetToken = process.env.EXPOSE_RESET_TOKEN;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      process.env.NODE_ENV = 'test';
      delete process.env.EXPOSE_RESET_TOKEN;
      const disabled = await request(app).post('/api/auth/forgot-password').send({ email: 'user@test.com' });
      expect(disabled.status).toBe(200);
      expect(disabled.body.resetToken).toBeUndefined();

      process.env.EXPOSE_RESET_TOKEN = 'true';
      const enabled = await request(app).post('/api/auth/forgot-password').send({ email: 'user@test.com' });
      expect(enabled.status).toBe(200);
      expect(enabled.body.resetToken).toBeTruthy();
      expect(enabled.body.message).toBe(disabled.body.message);

      process.env.NODE_ENV = 'production';
      const production = await request(app).post('/api/auth/forgot-password').send({ email: 'user@test.com' });
      expect(production.status).toBe(200);
      expect(production.body.resetToken).toBeUndefined();
      expect(production.body.message).toBe(disabled.body.message);
      expect(warn).toHaveBeenCalled();
    } finally {
      if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
      else process.env.NODE_ENV = originalNodeEnv;
      if (originalExposeResetToken === undefined) delete process.env.EXPOSE_RESET_TOKEN;
      else process.env.EXPOSE_RESET_TOKEN = originalExposeResetToken;
      warn.mockRestore();
    }
  });

  it('reset-password mật khẩu ngắn trả 400', async () => {
    const response = await request(app).post('/api/auth/reset-password').send({
      token: 'any-token', password: '123',
    });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/mật khẩu.*6/i);
  });

  it('profile fullName rỗng trả 400', async () => {
    const response = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ fullName: '' });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/họ tên|không được để trống/i);
  });

  it('tài khoản bị khóa không đăng nhập được', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'locked@test.com', password: 'test1234' });
    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/khóa/i);
  });

  it('đặt hàng thành công và trừ kho', async () => {
    const before = await prisma.product.findUnique({ where: { id: productId } });
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }], paymentMethod: 'cod',
        shippingInfo: {
          fullName: 'User Test', phone: '0900000000', email: 'user@test.com',
          address: '1 Test', city: 'HN', district: 'HK',
        },
      });
    expect(response.status).toBe(201);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.statusLogs).toHaveLength(1);
    const after = await prisma.product.findUnique({ where: { id: productId } });
    expect(after!.stock).toBe((before?.stock ?? 0) - 1);
  });

  it('admin chuyển trạng thái đơn hợp lệ (pending -> processing)', async () => {
    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }],
        paymentMethod: 'cod',
        shippingInfo: {
          fullName: 'User Test',
          phone: '0900000000',
          email: 'user@test.com',
          address: '1 Test',
          city: 'HN',
          district: 'HK',
        },
      });
    expect(created.status).toBe(201);
    const orderId = created.body.id as string;

    const response = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'processing' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('processing');
    expect(response.body.statusLogs?.length).toBeGreaterThanOrEqual(2);
  });

  it('admin chuyển nhảy cóc (pending -> delivered) trả 400', async () => {
    await prisma.product.update({ where: { id: productId }, data: { stock: 5 } });

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }],
        paymentMethod: 'cod',
        shippingInfo: {
          fullName: 'User Test',
          phone: '0900000000',
          email: 'user@test.com',
          address: '1 Test',
          city: 'HN',
          district: 'HK',
        },
      });
    expect(created.status).toBe(201);
    const orderId = created.body.id as string;

    const response = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'delivered' });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/Không thể chuyển từ/i);
  });

  it('admin lọc đơn hàng theo trạng thái và email', async () => {
    const response = await request(app)
      .get('/api/orders?status=pending&paymentStatus=unpaid&paymentMethod=cod&q=user%40test.com&sort=total-desc')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBeGreaterThan(0);
    expect(response.body.items.every((order: { status: string; userEmail: string; paymentStatus: string; paymentMethod: string }) =>
      order.status === 'pending' && order.userEmail === 'user@test.com'
      && order.paymentStatus === 'unpaid' && order.paymentMethod === 'cod')).toBe(true);
    expect(response.body.items.map((order: { total: number }) => order.total)).toEqual(
      [...response.body.items.map((order: { total: number }) => order.total)].sort((a: number, b: number) => b - a),
    );
  });

  it('admin lọc danh sách đánh giá theo số sao và từ khóa', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'user@test.com' } });
    const review = await prisma.review.create({
      data: { productId, userId: user.id, rating: 5, comment: 'Admin review filter test' },
    });

    try {
      const response = await request(app)
        .get('/api/reviews?rating=5&q=Admin%20review')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(1);
      expect(response.body.items[0]).toMatchObject({
        id: review.id,
        rating: 5,
        user: { id: user.id, email: user.email },
        product: { id: productId },
      });

      const forbidden = await request(app)
        .get('/api/reviews')
        .set('Authorization', `Bearer ${userToken}`);
      expect(forbidden.status).toBe(403);
    } finally {
      await prisma.review.delete({ where: { id: review.id } });
    }
  });

  it('admin sắp xếp đánh giá theo số sao', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'user@test.com' } });
    const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@test.com' } });
    const reviews = await Promise.all([
      prisma.review.create({
        data: { productId, userId: user.id, rating: 5, comment: 'Admin review sort test' },
      }),
      prisma.review.create({
        data: { productId, userId: admin.id, rating: 2, comment: 'Admin review sort test' },
      }),
    ]);

    try {
      const response = await request(app)
        .get('/api/reviews?q=Admin%20review%20sort%20test&sort=rating-asc')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items.map((review: { rating: number }) => review.rating)).toEqual([2, 5]);
    } finally {
      await prisma.review.deleteMany({ where: { id: { in: reviews.map((review) => review.id) } } });
    }
  });

  it('đặt hàng vượt tồn kho bị từ chối', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 99 }], paymentMethod: 'cod',
        shippingInfo: {
          fullName: 'User Test', phone: '0900000000', email: 'user@test.com',
          address: '1 Test', city: 'HN', district: 'HK',
        },
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/kho|tồn/i);
  });

  it('đặt hàng với SĐT sai định dạng trả 400', async () => {
    const response = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }],
        paymentMethod: 'cod',
        shippingInfo: {
          fullName: 'User Test',
          phone: '12345',
          email: 'user@test.com',
          address: '1 Test',
          city: 'HN',
          district: 'HK',
        },
      });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/số điện thoại|phone/i);
  });

  it('user thường gọi API admin bị 403', async () => {
    const response = await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`);
    expect(response.status).toBe(403);
  });

  it('GET đường dẫn /api không tồn tại trả 404', async () => {
    const response = await request(app).get('/api/duong-dan-khong-ton-tai');
    expect(response.status).toBe(404);
    expect(response.body.message).toBeTruthy();
  });

  it('POST body JSON sai cú pháp trả 400', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{bad json');
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/JSON|không hợp lệ/i);
  });

  it('user hủy đơn hoàn kho và hủy lần 2 trả 400', async () => {
    await prisma.product.update({ where: { id: productId }, data: { stock: 5 } });
    const before = await prisma.product.findUnique({ where: { id: productId } });

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }],
        paymentMethod: 'cod',
        shippingInfo: {
          fullName: 'User Test',
          phone: '0900000000',
          email: 'user@test.com',
          address: '1 Test',
          city: 'HN',
          district: 'HK',
        },
      });
    expect(created.status).toBe(201);
    const orderId = created.body.id as string;

    const afterOrder = await prisma.product.findUnique({ where: { id: productId } });
    expect(afterOrder!.stock).toBe((before?.stock ?? 0) - 1);

    const cancelled = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(cancelled.status).toBe(200);
    expect(cancelled.body.status).toBe('cancelled');

    const afterCancel = await prisma.product.findUnique({ where: { id: productId } });
    expect(afterCancel!.stock).toBe(before?.stock ?? 0);

    const second = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(second.status).toBe(400);
    expect(second.body.message).toMatch(/hủy|đã được hủy/i);
  });

  it('đơn transfer mới tạo unpaid; admin PATCH payment paid; user thường bị 403', async () => {
    await prisma.product.update({ where: { id: productId }, data: { stock: 5 } });

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }],
        paymentMethod: 'transfer',
        shippingInfo: {
          fullName: 'User Test',
          phone: '0900000000',
          email: 'user@test.com',
          address: '1 Test',
          city: 'HN',
          district: 'HK',
        },
      });
    expect(created.status).toBe(201);
    expect(created.body.paymentStatus).toBe('unpaid');
    expect(created.body.paidAt).toBeNull();
    const orderId = created.body.id as string;

    const forbidden = await request(app)
      .patch(`/api/orders/${orderId}/payment`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ paymentStatus: 'paid' });
    expect(forbidden.status).toBe(403);

    const paid = await request(app)
      .patch(`/api/orders/${orderId}/payment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentStatus: 'paid' });
    expect(paid.status).toBe(200);
    expect(paid.body.paymentStatus).toBe('paid');
    expect(paid.body.paidAt).toBeTruthy();
  });

  it('không đổi được thanh toán của đơn đã cancelled (400)', async () => {
    await prisma.product.update({ where: { id: productId }, data: { stock: 5 } });

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }],
        paymentMethod: 'transfer',
        shippingInfo: {
          fullName: 'User Test',
          phone: '0900000000',
          email: 'user@test.com',
          address: '1 Test',
          city: 'HN',
          district: 'HK',
        },
      });
    expect(created.status).toBe(201);
    const orderId = created.body.id as string;

    const cancelled = await request(app)
      .post(`/api/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(cancelled.status).toBe(200);

    const response = await request(app)
      .patch(`/api/orders/${orderId}/payment`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ paymentStatus: 'paid' });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/hủy/i);
  });

  it('đơn COD khi delivered tự đánh dấu paymentStatus paid', async () => {
    await prisma.product.update({ where: { id: productId }, data: { stock: 5 } });

    const created = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId, quantity: 1 }],
        paymentMethod: 'cod',
        shippingInfo: {
          fullName: 'User Test',
          phone: '0900000000',
          email: 'user@test.com',
          address: '1 Test',
          city: 'HN',
          district: 'HK',
        },
      });
    expect(created.status).toBe(201);
    expect(created.body.paymentStatus).toBe('unpaid');
    const orderId = created.body.id as string;

    for (const status of ['processing', 'shipping', 'delivered'] as const) {
      const res = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.status).toBe(status);
      if (status === 'delivered') {
        expect(res.body.paymentStatus).toBe('paid');
        expect(res.body.paidAt).toBeTruthy();
      } else {
        expect(res.body.paymentStatus).toBe('unpaid');
      }
    }
  });
});
