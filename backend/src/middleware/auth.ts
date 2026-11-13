import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'techstore-secret';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Xác thực JWT + kiểm tra isActive trong DB.
 * JWT còn hạn 7 ngày nên bắt buộc đọc DB; mỗi request authenticated thêm 1 SELECT theo PK (nhanh, chấp nhận được).
 */
export async function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;

    // Kiểm tra tài khoản còn tồn tại và chưa bị khóa
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa' });
    }

    req.user = { userId: user.id, email: user.email, role: user.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }
}

export function adminRequired(req: Request, res: Response, next: NextFunction) {
  authRequired(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Không có quyền admin' });
    }
    next();
  });
}