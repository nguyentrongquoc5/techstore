import rateLimit, { type Options } from 'express-rate-limit';

type ApiLimiterOptions = Pick<Partial<Options>, 'max' | 'windowMs'>;

export function createApiLimiter(options: ApiLimiterOptions = {}) {
  return rateLimit({
    windowMs: options.windowMs ?? 60_000,
    max: options.max ?? 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Quá nhiều yêu cầu, vui lòng thử lại sau' },
    skip: (req) =>
      process.env.NODE_ENV === 'test' ||
      req.originalUrl.split('?')[0] === '/api/health',
  });
}
