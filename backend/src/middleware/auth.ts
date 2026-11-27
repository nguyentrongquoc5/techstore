import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) return secret;

  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET is required when NODE_ENV=production');
    process.exit(1);
  }

  return 'techstore-secret';
}

const JWT_SECRET = resolveJwtSecret();

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

export async function authRequired(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Chưa đăng nhập' });
  }
  let payload: AuthPayload;
  try {
    const verified = jwt.verify(header.slice(7), JWT_SECRET);
    if (typeof verified === 'string' || typeof verified.userId !== 'string') {
      return res.status(401).json({ message: 'Token không hợp lệ' });
    }
    payload = verified as AuthPayload;
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ' });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) {
    return res.status(401).json({ message: 'Tài khoản không tồn tại hoặc đã bị khóa' });
  }
  req.user = { userId: user.id, email: user.email, role: user.role };
  return next();
}

export async function adminRequired(req: Request, res: Response, next: NextFunction) {
  await authRequired(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Không có quyền admin' });
    }
    return next();
  });
}
