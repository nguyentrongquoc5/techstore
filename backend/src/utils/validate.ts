import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

/** Middleware validate body bằng Zod. Trả 400 { message } tiếng Việt khi lỗi. */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      const message = first?.message || 'Dữ liệu không hợp lệ';
      return res.status(400).json({ message });
    }
    // Gán lại body đã parse (đã trim / transform nếu schema có)
    req.body = result.data;
    next();
  };
}
