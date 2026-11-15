import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { MulterError } from 'multer';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Kích thước ảnh tối đa là 5MB.' });
    }
    return res.status(400).json({ message: 'Lỗi tải tệp lên hệ thống.' });
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    return res.status(400).json({
      message: firstIssue?.message || 'Dữ liệu đầu vào không hợp lệ.',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ message: 'Dữ liệu đã tồn tại trong hệ thống.' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ message: 'Không thể thao tác do còn dữ liệu liên kết.' });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ message: 'Không tìm thấy bản ghi yêu cầu.' });
    }
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ message: 'Lỗi hệ thống máy chủ.' });
}
