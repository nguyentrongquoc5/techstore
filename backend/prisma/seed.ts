import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Ảnh: public/images/products/<filename> — bạn tự thả file vào thư mục này */
const productsSeed = [
  // Laptop (8) — folder: laptop
  { name: 'MacBook Air M3', cat: 'laptop', brand: 'Apple', price: 28990000, sale: 26990000, img: 'laptop-01.jpg', featured: true, best: true },
  { name: 'MacBook Pro 14', cat: 'laptop', brand: 'Apple', price: 45990000, sale: 42990000, img: 'laptop-02.jpg', featured: true, best: true },
  { name: 'Dell XPS 13', cat: 'laptop', brand: 'Dell', price: 32990000, sale: null, img: 'laptop-03.jpg', featured: true, best: false },
  { name: 'ASUS ROG Zephyrus', cat: 'laptop', brand: 'ASUS', price: 45990000, sale: 42990000, img: 'laptop-04.jpg', featured: true, best: true },
  { name: 'Lenovo ThinkPad X1', cat: 'laptop', brand: 'Lenovo', price: 35990000, sale: 33990000, img: 'laptop-05.jpg', featured: false, best: false },
  { name: 'HP Spectre x360', cat: 'laptop', brand: 'HP', price: 34590000, sale: null, img: 'laptop-06.jpg', featured: false, best: true },
  { name: 'Acer Swift 5', cat: 'laptop', brand: 'Acer', price: 18990000, sale: 16990000, img: 'laptop-07.jpg', featured: false, best: false },
  { name: 'MSI Prestige 14', cat: 'laptop', brand: 'MSI', price: 27990000, sale: 25990000, img: 'laptop-08.jpg', featured: true, best: false },
  // Điện thoại (8)
  { name: 'iPhone 16 Pro', cat: 'dien-thoai', brand: 'Apple', price: 28990000, sale: 27990000, img: 'phone-01.jpg', featured: true, best: true },
  { name: 'Samsung Galaxy S25', cat: 'dien-thoai', brand: 'Samsung', price: 24990000, sale: 22990000, img: 'phone-02.jpg', featured: true, best: true },
  { name: 'Xiaomi 15 Ultra', cat: 'dien-thoai', brand: 'Xiaomi', price: 19990000, sale: 17990000, img: 'phone-03.jpg', featured: true, best: false },
  { name: 'iPhone 15', cat: 'dien-thoai', brand: 'Apple', price: 19990000, sale: 18990000, img: 'phone-04.jpg', featured: false, best: true },
  { name: 'Samsung Galaxy A55', cat: 'dien-thoai', brand: 'Samsung', price: 9990000, sale: 8990000, img: 'phone-05.jpg', featured: false, best: false },
  { name: 'Google Pixel 9', cat: 'dien-thoai', brand: 'Google', price: 18990000, sale: null, img: 'phone-06.jpg', featured: false, best: false },
  { name: 'OPPO Find X8', cat: 'dien-thoai', brand: 'OPPO', price: 16990000, sale: 15990000, img: 'phone-07.jpg', featured: false, best: false },
  { name: 'Vivo X200', cat: 'dien-thoai', brand: 'Vivo', price: 15990000, sale: 14990000, img: 'phone-08.jpg', featured: false, best: false },
  // Máy tính bảng (4)
  { name: 'iPad Pro M4', cat: 'may-tinh-bang', brand: 'Apple', price: 25990000, sale: 24990000, img: 'tablet-01.jpg', featured: true, best: true },
  { name: 'Samsung Galaxy Tab S10', cat: 'may-tinh-bang', brand: 'Samsung', price: 18990000, sale: 16990000, img: 'tablet-02.jpg', featured: true, best: false },
  { name: 'iPad Air', cat: 'may-tinh-bang', brand: 'Apple', price: 15990000, sale: null, img: 'tablet-03.jpg', featured: false, best: true },
  { name: 'Xiaomi Pad 7', cat: 'may-tinh-bang', brand: 'Xiaomi', price: 8990000, sale: 7990000, img: 'tablet-04.jpg', featured: false, best: false },
  // Màn hình (4)
  { name: 'LG UltraGear 27', cat: 'man-hinh', brand: 'LG', price: 7990000, sale: 6990000, img: 'monitor-01.jpg', featured: true, best: true },
  { name: 'Samsung Odyssey G7', cat: 'man-hinh', brand: 'Samsung', price: 12990000, sale: 10990000, img: 'monitor-02.jpg', featured: true, best: true },
  { name: 'Dell UltraSharp 32', cat: 'man-hinh', brand: 'Dell', price: 14990000, sale: null, img: 'monitor-03.jpg', featured: false, best: false },
  { name: 'ASUS ProArt', cat: 'man-hinh', brand: 'ASUS', price: 11990000, sale: 10990000, img: 'monitor-04.jpg', featured: false, best: false },
  // Bàn phím (4)
  { name: 'Keychron K8 Pro', cat: 'ban-phim', brand: 'Keychron', price: 2490000, sale: 2190000, img: 'keyboard-01.jpg', featured: true, best: true },
  { name: 'Logitech MX Keys', cat: 'ban-phim', brand: 'Logitech', price: 2990000, sale: null, img: 'keyboard-02.jpg', featured: true, best: false },
  { name: 'Razer BlackWidow V4', cat: 'ban-phim', brand: 'Razer', price: 3990000, sale: 3490000, img: 'keyboard-03.jpg', featured: false, best: true },
  { name: 'Corsair K70', cat: 'ban-phim', brand: 'Corsair', price: 3590000, sale: 3290000, img: 'keyboard-04.jpg', featured: false, best: false },
  // Chuột (4)
  { name: 'Logitech MX Master 3S', cat: 'chuot', brand: 'Logitech', price: 2490000, sale: 2290000, img: 'mouse-01.jpg', featured: true, best: true },
  { name: 'Razer DeathAdder V3', cat: 'chuot', brand: 'Razer', price: 1890000, sale: 1690000, img: 'mouse-02.jpg', featured: true, best: true },
  { name: 'Apple Magic Mouse', cat: 'chuot', brand: 'Apple', price: 2290000, sale: 1990000, img: 'mouse-03.jpg', featured: false, best: false },
  { name: 'SteelSeries Aerox 5', cat: 'chuot', brand: 'SteelSeries', price: 2590000, sale: 2290000, img: 'mouse-04.jpg', featured: false, best: true },
  // Tai nghe (4)
  { name: 'Sony WH-1000XM5', cat: 'tai-nghe', brand: 'Sony', price: 8490000, sale: 7990000, img: 'headphone-01.jpg', featured: true, best: true },
  { name: 'AirPods Pro 2', cat: 'tai-nghe', brand: 'Apple', price: 5990000, sale: 5490000, img: 'headphone-02.jpg', featured: true, best: true },
  { name: 'Samsung Galaxy Buds3', cat: 'tai-nghe', brand: 'Samsung', price: 3990000, sale: 3490000, img: 'headphone-03.jpg', featured: false, best: false },
  { name: 'Bose QuietComfort', cat: 'tai-nghe', brand: 'Bose', price: 7990000, sale: null, img: 'headphone-04.jpg', featured: true, best: false },
  // Webcam (3)
  { name: 'Logitech C920e', cat: 'webcam', brand: 'Logitech', price: 1890000, sale: 1690000, img: 'webcam-01.jpg', featured: true, best: true },
  { name: 'Razer Kiyo Pro', cat: 'webcam', brand: 'Razer', price: 3490000, sale: 2990000, img: 'webcam-02.jpg', featured: false, best: false },
  { name: 'Elgato Facecam', cat: 'webcam', brand: 'Elgato', price: 4990000, sale: null, img: 'webcam-03.jpg', featured: true, best: false },
  // Phụ kiện (4)
  { name: 'Anker 735 Charger', cat: 'phu-kien', brand: 'Anker', price: 990000, sale: 890000, img: 'accessory-01.jpg', featured: true, best: true },
  { name: 'Apple MagSafe', cat: 'phu-kien', brand: 'Apple', price: 1190000, sale: null, img: 'accessory-02.jpg', featured: false, best: true },
  { name: 'Samsung 45W Adapter', cat: 'phu-kien', brand: 'Samsung', price: 690000, sale: 590000, img: 'accessory-03.jpg', featured: false, best: false },
  { name: 'Baseus Hub USB-C', cat: 'phu-kien', brand: 'Baseus', price: 490000, sale: 390000, img: 'accessory-04.jpg', featured: false, best: true },
];

const categories = [
  { name: 'Laptop', slug: 'laptop', description: 'Laptop văn phòng, gaming, đồ họa' },
  { name: 'Điện thoại', slug: 'dien-thoai', description: 'Smartphone cao cấp và tầm trung' },
  { name: 'Máy tính bảng', slug: 'may-tinh-bang', description: 'Tablet Android và iPad' },
  { name: 'Màn hình', slug: 'man-hinh', description: 'Màn hình máy tính, gaming' },
  { name: 'Bàn phím', slug: 'ban-phim', description: 'Bàn phím cơ, văn phòng' },
  { name: 'Chuột', slug: 'chuot', description: 'Chuột gaming, không dây' },
  { name: 'Tai nghe', slug: 'tai-nghe', description: 'Tai nghe không dây, gaming' },
  { name: 'Webcam', slug: 'webcam', description: 'Webcam học online, livestream' },
  { name: 'Phụ kiện', slug: 'phu-kien', description: 'Sạc, ốp lưng, cáp, hub' },
];

async function main() {
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const passwordAdmin = await bcrypt.hash('admin123', 10);
  const passwordUser = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@gmail.com',
      password: passwordAdmin,
      fullName: 'Quản trị viên',
      phone: '0901234567',
      address: '123 Nguyễn Huệ',
      city: 'Hồ Chí Minh',
      district: 'Quận 1',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.create({
    data: {
      email: 'user@gmail.com',
      password: passwordUser,
      fullName: 'Nguyễn Văn A',
      phone: '0912345678',
      address: '456 Lê Lợi',
      city: 'Hà Nội',
      district: 'Hoàn Kiếm',
      role: 'USER',
    },
  });

  for (let i = 3; i <= 10; i++) {
    await prisma.user.create({
      data: {
        email: `user${i}@gmail.com`,
        password: passwordUser,
        fullName: `Người dùng ${i}`,
        phone: `090000000${i}`,
        role: 'USER',
        isActive: i !== 5,
      },
    });
  }

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    const created = await prisma.category.create({ data: c });
    catMap[c.slug] = created.id;
  }

  const createdProducts = [];
  for (const item of productsSeed) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '');
    const prod = await prisma.product.create({
      data: {
        name: item.name,
        slug: `${slug}-${item.img.replace('.jpg', '')}`,
        categoryId: catMap[item.cat],
        brand: item.brand,
        price: item.price,
        salePrice: item.sale,
        stock: 10 + Math.floor(Math.random() * 40),
        rating: Number((4 + Math.random()).toFixed(1)),
        reviewCount: 50 + Math.floor(Math.random() * 400),
        description: `${item.name} là sản phẩm công nghệ cao cấp. Thiết kế hiện đại, hiệu năng mạnh mẽ.`,
        specs: JSON.stringify({
          'Thương hiệu': item.brand,
          'Bảo hành': '12 tháng',
          'Xuất xứ': 'Chính hãng',
          'Tình trạng': 'Mới 100%',
        }),
        images: JSON.stringify([`/images/products/${item.img}`]),
        isFeatured: item.featured,
        isBestSeller: item.best,
        status: 'active',
      },
    });
    createdProducts.push(prod);
  }

  const p1 = createdProducts[0];
  const p9 = createdProducts[8];
  const pPhone = createdProducts.find((x) => x.name.includes('iPhone 16')) || p9;

  await prisma.order.create({
    data: {
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      items: JSON.stringify([
        {
          productId: p1.id,
          productName: p1.name,
          productImage: JSON.parse(p1.images)[0],
          price: p1.salePrice ?? p1.price,
          quantity: 1,
        },
      ]),
      subtotal: p1.salePrice ?? p1.price,
      discount: 0,
      shippingFee: 0,
      total: p1.salePrice ?? p1.price,
      status: 'delivered',
      paymentMethod: 'cod',
      shippingInfo: JSON.stringify({
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        address: user.address,
        city: user.city,
        district: user.district,
      }),
    },
  });

  await prisma.order.create({
    data: {
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      items: JSON.stringify([
        {
          productId: pPhone.id,
          productName: pPhone.name,
          productImage: JSON.parse(pPhone.images)[0],
          price: pPhone.salePrice ?? pPhone.price,
          quantity: 1,
        },
      ]),
      subtotal: pPhone.salePrice ?? pPhone.price,
      discount: 0,
      shippingFee: 30000,
      total: (pPhone.salePrice ?? pPhone.price) + 30000,
      status: 'pending',
      paymentMethod: 'cod',
      shippingInfo: JSON.stringify({
        fullName: user.fullName,
        phone: user.phone,
        email: user.email,
        address: user.address,
        city: user.city,
        district: user.district,
      }),
    },
  });

  // thêm vài đơn nữa
  const statuses = ['processing', 'shipping', 'delivered', 'cancelled', 'pending'];
  for (let i = 0; i < 8; i++) {
    const prod = createdProducts[i + 2];
    const price = prod.salePrice ?? prod.price;
    await prisma.order.create({
      data: {
        userId: user.id,
        userName: user.fullName,
        userEmail: user.email,
        items: JSON.stringify([
          {
            productId: prod.id,
            productName: prod.name,
            productImage: JSON.parse(prod.images)[0],
            price,
            quantity: 1,
          },
        ]),
        subtotal: price,
        discount: 0,
        shippingFee: 0,
        total: price,
        status: statuses[i % statuses.length],
        paymentMethod: i % 2 === 0 ? 'cod' : 'transfer',
        shippingInfo: JSON.stringify({
          fullName: user.fullName,
          phone: user.phone,
          email: user.email,
          address: user.address,
          city: user.city,
          district: user.district,
        }),
      },
    });
  }

  console.log('Seed OK:', {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    admin: admin.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
