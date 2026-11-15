import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { Role, UserStatus } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../config/prisma';

export interface AuthPayload {
  userId: number;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        fullName: string;
        role: Role;
        status: UserStatus;
      };
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Vui lòng đăng nhập để tiếp tục.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'Tài khoản không tồn tại.' });
    }

    if (user.status === UserStatus.BLOCKED) {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập.' });
  }
  if (req.user.role !== Role.ADMIN) {
    return res.status(403).json({ message: 'Bạn không có quyền truy cập trang quản trị.' });
  }
  next();
}
