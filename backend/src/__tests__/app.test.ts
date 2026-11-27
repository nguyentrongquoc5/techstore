import express from 'express';
import { describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { BusinessError } from '../utils/errors.js';
import errorHandler from '../middleware/errorHandler.js';
import { createApiLimiter } from '../middleware/rateLimit.js';

describe('Middleware ứng dụng', () => {
  it('trả BusinessError theo status và không để lộ lỗi máy chủ', async () => {
    const app = express();
    app.get('/business-error', () => {
      throw new BusinessError('abc', 404);
    });
    app.get('/unexpected-error', () => {
      throw new Error('Nội dung lỗi nội bộ');
    });
    app.use(errorHandler);

    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const businessError = await request(app).get('/business-error');
      expect(businessError.status).toBe(404);
      expect(businessError.body).toEqual({ message: 'abc' });

      const unexpectedError = await request(app).get('/unexpected-error');
      expect(unexpectedError.status).toBe(500);
      expect(unexpectedError.body).toEqual({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
      expect(unexpectedError.body.message).not.toContain('Nội dung lỗi nội bộ');
    } finally {
      logError.mockRestore();
    }
  });

  it('giới hạn request, bỏ qua /api/health và tắt limiter trong môi trường test', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    try {
      const app = express();
      app.use('/api', createApiLimiter({ max: 2, windowMs: 60_000 }));
      app.get('/api/health', (_req, res) => res.json({ ok: true }));
      app.get('/api/resource', (_req, res) => res.json({ ok: true }));

      for (let index = 0; index < 3; index += 1) {
        expect((await request(app).get('/api/health')).status).toBe(200);
      }

      expect((await request(app).get('/api/resource')).status).toBe(200);
      expect((await request(app).get('/api/resource')).status).toBe(200);
      const limited = await request(app).get('/api/resource');
      expect(limited.status).toBe(429);
      expect(limited.body).toEqual({ message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' });

      vi.stubEnv('NODE_ENV', 'test');
      const testModeRequest = await request(app).get('/api/resource');
      expect(testModeRequest.status).toBe(200);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('chuẩn hóa danh sách origin và dùng mặc định khi cấu hình rỗng', async () => {
    vi.stubEnv('FRONTEND_URL', ' http://localhost:5173/ , , https://techstore.onrender.com/ ');
    vi.resetModules();
    try {
      const { getFrontendOrigins } = await import('../utils/config.js');
      expect(getFrontendOrigins()).toEqual([
        'http://localhost:5173',
        'https://techstore.onrender.com',
      ]);

      vi.stubEnv('FRONTEND_URL', ' , / ');
      expect(getFrontendOrigins()).toEqual(['http://localhost:5173']);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('CORS cho phép origin cấu hình, từ chối origin lạ và đọc TRUST_PROXY', async () => {
    vi.stubEnv('FRONTEND_URL', 'http://localhost:5173,https://techstore.onrender.com/');
    vi.stubEnv('TRUST_PROXY', '1');
    vi.resetModules();
    try {
      const { default: app } = await import('../app.js');
      expect(app.get('trust proxy')).toBe(1);

      const allowed = await request(app)
        .get('/api/health')
        .set('Origin', 'https://techstore.onrender.com');
      expect(allowed.status).toBe(200);
      expect(allowed.headers['access-control-allow-origin']).toBe('https://techstore.onrender.com');

      const unknown = await request(app)
        .get('/api/health')
        .set('Origin', 'https://untrusted.example');
      expect(unknown.status).toBe(200);
      expect(unknown.headers['access-control-allow-origin']).toBeUndefined();

      const withoutOrigin = await request(app).get('/api/health');
      expect(withoutOrigin.status).toBe(200);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
