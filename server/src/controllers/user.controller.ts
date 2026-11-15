import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PostStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { formatPaginatedResponse, parseListQuery } from '../utils/pagination';
import { delCacheByPrefix } from '../utils/cache';
import { buildPostListWhere, generateUniquePostSlug, postSchema } from '../utils/postHelpers';
import { AppError } from '../middlewares/error.middleware';

const safeImageUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (val) => val === '' || /^https?:\/\//i.test(val) || val.startsWith('/uploads/'),
    'Đường dẫn ảnh phải bắt đầu bằng http://, https:// hoặc /uploads/.'
  )
  .optional()
  .nullable();

const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  birthYear: z.coerce.number().int().min(1920).max(new Date().getFullYear()).optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  phoneNumber: z.string().max(20).optional().nullable(),
  avatar: safeImageUrl,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại.'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự.'),
});

export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
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
      },
    });
    if (!user) throw new AppError('Không tìm thấy tài khoản.', 404);
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const data = updateProfileSchema.parse(req.body);

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        fullName: data.fullName.trim(),
        birthYear: data.birthYear ?? null,
        address: data.address?.trim() || null,
        phoneNumber: data.phoneNumber?.trim() || null,
        avatar: data.avatar?.trim() || null,
      },
      select: {
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
      },
    });

    return res.json({
      message: 'Cập nhật thông tin cá nhân thành công.',
      user: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    const data = changePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError('Không tìm thấy tài khoản.', 404);

    const isMatch = await bcrypt.compare(data.currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Mật khẩu hiện tại không chính xác.', 400);
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (err) {
    next(err);
  }
}

// ===================== USER POSTS MANAGEMENT =====================

export async function getMyPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip, search, sortBy, sortOrder } = parseListQuery(
      req.query as Record<string, unknown>,
      ['createdAt', 'updatedAt', 'views', 'title', 'status'],
      'createdAt'
    );

    const where = buildPostListWhere(req.query as Record<string, unknown>, search, req.user!.id);

    const [totalItems, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { comments: true } },
        },
      }),
    ]);

    return res.json(formatPaginatedResponse(posts, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getMyPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ.', 400);

    const post = await prisma.post.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!post) throw new AppError('Không tìm thấy bài viết.', 404);
    if (post.authorId !== req.user!.id) {
      throw new AppError('Bạn không có quyền truy cập bài viết này.', 403);
    }

    return res.json({ post });
  } catch (err) {
    next(err);
  }
}

export async function createMyPost(req: Request, res: Response, next: NextFunction) {
  try {
    const data = postSchema.parse(req.body);

    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError('Danh mục không tồn tại.', 404);

    const slug = await generateUniquePostSlug(data.title);
    const post = await prisma.post.create({
      data: {
        title: data.title,
        slug,
        summary: data.summary || null,
        content: data.content,
        thumbnail: data.thumbnail || null,
        status: data.status,
        categoryId: data.categoryId,
        authorId: req.user!.id,
      },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    delCacheByPrefix('categories:');

    return res.status(201).json({
      message: 'Đăng bài viết thành công.',
      post,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMyPost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ.', 400);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new AppError('Không tìm thấy bài viết.', 404);
    if (existing.authorId !== req.user!.id) {
      throw new AppError('Bạn chỉ có thể chỉnh sửa bài viết của chính mình.', 403);
    }

    const data = postSchema.parse(req.body);
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) throw new AppError('Danh mục không tồn tại.', 404);

    const slug =
      existing.title !== data.title
        ? await generateUniquePostSlug(data.title, id)
        : existing.slug;

    const post = await prisma.post.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        summary: data.summary || null,
        content: data.content,
        thumbnail: data.thumbnail || null,
        status: data.status,
        categoryId: data.categoryId,
      },
    });

    delCacheByPrefix('post:slug:');
    delCacheByPrefix('categories:');

    return res.json({
      message: 'Cập nhật bài viết thành công.',
      post,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMyPostStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ.', 400);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new AppError('Không tìm thấy bài viết.', 404);
    if (existing.authorId !== req.user!.id) {
      throw new AppError('Bạn chỉ có thể thay đổi trạng thái bài viết của chính mình.', 403);
    }

    const status = z.nativeEnum(PostStatus).parse(req.body.status);
    const post = await prisma.post.update({
      where: { id },
      data: { status },
      select: { id: true, title: true, status: true },
    });

    delCacheByPrefix('post:slug:');
    delCacheByPrefix('categories:');

    return res.json({
      message: 'Cập nhật trạng thái bài viết thành công.',
      post,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteMyPost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ.', 400);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new AppError('Không tìm thấy bài viết.', 404);
    if (existing.authorId !== req.user!.id) {
      throw new AppError('Bạn chỉ có thể xóa bài viết của chính mình.', 403);
    }

    await prisma.post.delete({ where: { id } });
    delCacheByPrefix('post:slug:');
    delCacheByPrefix('categories:');

    return res.json({ message: 'Đã xóa bài viết của bạn.' });
  } catch (err) {
    next(err);
  }
}
