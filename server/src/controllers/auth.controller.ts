import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Role, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';

const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  birthYear: z.coerce.number().int().min(1920).max(new Date().getFullYear()).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
});

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});

function signToken(userId: number, role: Role) {
  return jwt.sign({ userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

const publicUserSelect = {
  id: true,
  email: true,
  fullName: true,
  birthYear: true,
  address: true,
  phoneNumber: true,
  avatar: true,
  role: true,
  status: true,
  createdAt: true,
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('Email này đã được đăng ký.', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: data.fullName.trim(),
        birthYear: data.birthYear ?? null,
        address: data.address?.trim() || null,
        phoneNumber: data.phoneNumber?.trim() || null,
        role: Role.USER,
      },
      select: publicUserSelect,
    });

    const token = signToken(user.id, user.role);
    return res.status(201).json({
      message: 'Đăng ký tài khoản thành công.',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new AppError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.', 403);
    }

    const token = signToken(user.id, user.role);
    const { password: _pwd, ...safeUser } = user;

    return res.json({
      message: 'Đăng nhập thành công.',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (!user || !(await bcrypt.compare(data.password, user.password))) {
      throw new AppError('Email hoặc mật khẩu không chính xác.', 401);
    }

    if (user.role !== Role.ADMIN) {
      throw new AppError('Tài khoản này không có quyền quản trị viên.', 403);
    }

    if (user.status === UserStatus.BLOCKED) {
      throw new AppError('Tài khoản quản trị viên này đang bị khóa.', 403);
    }

    const token = signToken(user.id, user.role);
    const { password: _pwd, ...safeUser } = user;

    return res.json({
      message: 'Đăng nhập trang quản trị thành công.',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: publicUserSelect,
    });
    if (!user) {
      throw new AppError('Không tìm thấy người dùng.', 404);
    }
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}
