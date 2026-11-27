import express from 'express';
import type { Request, Response } from 'express';
import 'express-async-errors';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import userRoutes from './routes/users.js';
import statsRoutes from './routes/stats.js';
import couponRoutes from './routes/coupons.js';
import reviewRoutes from './routes/reviews.js';
import wishlistRoutes from './routes/wishlist.js';
import contactRoutes from './routes/contacts.js';
import addressRoutes from './routes/addresses.js';
import paymentRoutes from './routes/payments.js';
import errorHandler from './middleware/errorHandler.js';
import { createApiLimiter } from './middleware/rateLimit.js';
import { getFrontendOrigins } from './utils/config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const trustProxyValue = process.env.TRUST_PROXY?.trim();
if (trustProxyValue) {
  const trustProxy = Number(trustProxyValue);
  if (Number.isInteger(trustProxy) && trustProxy >= 0) {
    app.set('trust proxy', trustProxy);
  }
}

const frontendOrigins = getFrontendOrigins();

app.use(
  helmet({
    // Cho phép frontend tải ảnh tĩnh từ /images (CORP mặc định của helmet là same-origin)
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || frontendOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

app.use('/api', createApiLimiter());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api', reviewRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);

/** 404 chỉ cho đường dẫn /api/* */
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Không tìm thấy đường dẫn' });
});

app.use(errorHandler);

export default app;
