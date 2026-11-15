import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { PostStatus, Prisma, Role, UserStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { formatPaginatedResponse, parseListQuery } from '../utils/pagination';
import { toSlug } from '../utils/slug';
import { delCacheByPrefix } from '../utils/cache';
import { buildPostListWhere, generateUniquePostSlug, postSchema } from '../utils/postHelpers';
import { AppError } from '../middlewares/error.middleware';

// ===================== SCHEMAS =====================

const categorySchema = z.object({
  name: z.string().trim().min(2, 'Tên danh mục phải có ít nhất 2 ký tự.').max(100),
  description: z.string().trim().max(500).optional().nullable(),
});

const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  birthYear: z.coerce.number().int().min(1920).max(new Date().getFullYear()).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  phoneNumber: z.string().trim().max(20).optional().nullable(),
  status: z.nativeEnum(UserStatus),
});

const createAdminSchema = z.object({
  email: z.string().email('Email không hợp lệ.'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự.'),
  birthYear: z.coerce.number().int().min(1920).max(new Date().getFullYear()).optional().nullable(),
  address: z.string().trim().max(255).optional().nullable(),
  phoneNumber: z.string().trim().max(20).optional().nullable(),
});

const updateAdminPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự.'),
});

async function generateUniqueCategorySlug(name: string, excludeCategoryId?: number): Promise<string> {
  const baseSlug = toSlug(name) || `danh-muc-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeCategoryId) {
      return slug;
    }
    slug = `${baseSlug}-${counter++}`;
  }
}

// ===================== DASHBOARD STATS =====================

export async function getAdminStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const [
      totalPosts,
      publishedPosts,
      hiddenPosts,
      draftPosts,
      totalCategories,
      totalUsers,
      totalAdmins,
      totalComments,
      recentPosts,
    ] = await Promise.all([
      prisma.post.count(),
      prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
      prisma.post.count({ where: { status: PostStatus.HIDDEN } }),
      prisma.post.count({ where: { status: PostStatus.DRAFT } }),
      prisma.category.count(),
      prisma.user.count({ where: { role: Role.USER } }),
      prisma.user.count({ where: { role: Role.ADMIN } }),
      prisma.comment.count(),
      prisma.post.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          views: true,
          createdAt: true,
          category: { select: { name: true } },
        },
      }),
    ]);

    return res.json({
      stats: {
        totalPosts,
        publishedPosts,
        hiddenPosts,
        draftPosts,
        totalCategories,
        totalUsers,
        totalAdmins,
        totalComments,
      },
      recentPosts,
    });
  } catch (err) {
    next(err);
  }
}

// ===================== POSTS MANAGEMENT =====================

export async function getAdminPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip, search, sortBy, sortOrder } = parseListQuery(
      req.query as Record<string, unknown>,
      ['createdAt', 'updatedAt', 'views', 'title', 'status'],
      'createdAt'
    );

    const where = buildPostListWhere(req.query as Record<string, unknown>, search);

    const [totalItems, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          author: { select: { id: true, fullName: true, email: true } },
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

export async function getAdminPostById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ.', 400);

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        author: { select: { id: true, fullName: true } },
      },
    });

    if (!post) throw new AppError('Không tìm thấy bài viết.', 404);
    return res.json({ post });
  } catch (err) {
    next(err);
  }
}

export async function createPost(req: Request, res: Response, next: NextFunction) {
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
      message: 'Tạo bài viết mới thành công.',
      post,
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ.', 400);

    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) throw new AppError('Không tìm thấy bài viết.', 404);

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

export async function updatePostStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ.', 400);

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

export async function deletePost(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID bài viết không hợp lệ.', 400);

    await prisma.post.delete({ where: { id } });
    delCacheByPrefix('post:slug:');
    delCacheByPrefix('categories:');
    return res.json({ message: 'Đã xóa bài viết thành công.' });
  } catch (err) {
    next(err);
  }
}

// ===================== CATEGORIES MANAGEMENT =====================

export async function getAdminCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip, search, sortBy, sortOrder } = parseListQuery(
      req.query as Record<string, unknown>,
      ['name', 'createdAt'],
      'createdAt'
    );

    const hasPosts = req.query.hasPosts;
    const where: Prisma.CategoryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hasPosts === 'true') {
      where.posts = { some: {} };
    } else if (hasPosts === 'false') {
      where.posts = { none: {} };
    }

    const orderBy: Prisma.CategoryOrderByWithRelationInput =
      req.query.sortBy === 'postsCount'
        ? { posts: { _count: sortOrder } }
        : { [sortBy]: sortOrder };

    const [totalItems, categories] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          _count: { select: { posts: true } },
        },
      }),
    ]);

    return res.json(formatPaginatedResponse(categories, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const data = categorySchema.parse(req.body);

    const existingName = await prisma.category.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });
    if (existingName) {
      throw new AppError('Tên danh mục đã tồn tại.', 409);
    }

    const slug = await generateUniqueCategorySlug(data.name);
    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description || null,
      },
    });

    delCacheByPrefix('categories:');

    return res.status(201).json({
      message: 'Thêm danh mục mới thành công.',
      category,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID danh mục không hợp lệ.', 400);

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) throw new AppError('Không tìm thấy danh mục.', 404);

    const data = categorySchema.parse(req.body);
    const duplicateName = await prisma.category.findFirst({
      where: {
        name: { equals: data.name, mode: 'insensitive' },
        NOT: { id },
      },
    });
    if (duplicateName) throw new AppError('Tên danh mục đã tồn tại.', 409);

    const slug =
      existing.name !== data.name
        ? await generateUniqueCategorySlug(data.name, id)
        : existing.slug;

    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        description: data.description || null,
      },
    });

    delCacheByPrefix('categories:');
    delCacheByPrefix('post:slug:');

    return res.json({
      message: 'Cập nhật danh mục thành công.',
      category,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID danh mục không hợp lệ.', 400);

    const postCount = await prisma.post.count({ where: { categoryId: id } });
    if (postCount > 0) {
      throw new AppError(
        `Không thể xóa danh mục vì đang có ${postCount} bài viết thuộc danh mục này.`,
        400
      );
    }

    await prisma.category.delete({ where: { id } });
    delCacheByPrefix('categories:');
    return res.json({ message: 'Đã xóa danh mục thành công.' });
  } catch (err) {
    next(err);
  }
}

// ===================== USERS MANAGEMENT =====================

export async function getAdminUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip, search, sortBy, sortOrder } = parseListQuery(
      req.query as Record<string, unknown>,
      ['createdAt', 'fullName', 'email', 'birthYear', 'status'],
      'createdAt'
    );

    const status =
      typeof req.query.status === 'string' && Object.values(UserStatus).includes(req.query.status as UserStatus)
        ? (req.query.status as UserStatus)
        : undefined;

    const where: Prisma.UserWhereInput = {
      role: Role.USER,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [totalItems, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
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
          _count: { select: { comments: true } },
        },
      }),
    ]);

    return res.json(formatPaginatedResponse(users, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function updateAdminUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID người dùng không hợp lệ.', 400);

    const existing = await prisma.user.findFirst({ where: { id, role: Role.USER } });
    if (!existing) throw new AppError('Không tìm thấy tài khoản người dùng.', 404);

    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id },
      data: {
        fullName: data.fullName,
        birthYear: data.birthYear ?? null,
        address: data.address || null,
        phoneNumber: data.phoneNumber || null,
        status: data.status,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        birthYear: true,
        address: true,
        phoneNumber: true,
        status: true,
        createdAt: true,
      },
    });

    return res.json({
      message: 'Cập nhật thông tin tài khoản thành công.',
      user,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID người dùng không hợp lệ.', 400);

    const existing = await prisma.user.findFirst({ where: { id, role: Role.USER } });
    if (!existing) throw new AppError('Không tìm thấy tài khoản người dùng.', 404);

    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'Đã xóa tài khoản người dùng.' });
  } catch (err) {
    next(err);
  }
}

// ===================== ADMIN ACCOUNTS MANAGEMENT =====================

export async function getAdminAccounts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip, search, sortBy, sortOrder } = parseListQuery(
      req.query as Record<string, unknown>,
      ['createdAt', 'fullName', 'email', 'status'],
      'createdAt'
    );

    const status =
      typeof req.query.status === 'string' && Object.values(UserStatus).includes(req.query.status as UserStatus)
        ? (req.query.status as UserStatus)
        : undefined;

    const where: Prisma.UserWhereInput = {
      role: Role.ADMIN,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [totalItems, admins] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          fullName: true,
          birthYear: true,
          address: true,
          phoneNumber: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { posts: true } },
        },
      }),
    ]);

    return res.json(formatPaginatedResponse(admins, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function createAdminAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createAdminSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new AppError('Email này đã được sử dụng.', 409);

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: data.fullName,
        birthYear: data.birthYear ?? null,
        address: data.address || null,
        phoneNumber: data.phoneNumber || null,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        birthYear: true,
        address: true,
        phoneNumber: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: 'Tạo tài khoản quản trị viên mới thành công.',
      admin,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID quản trị viên không hợp lệ.', 400);

    const existing = await prisma.user.findFirst({ where: { id, role: Role.ADMIN } });
    if (!existing) throw new AppError('Không tìm thấy tài khoản quản trị viên.', 404);

    const data = updateAdminPasswordSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Cập nhật mật khẩu quản trị viên thành công.' });
  } catch (err) {
    next(err);
  }
}

export async function updateAdminStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID quản trị viên không hợp lệ.', 400);

    if (id === req.user!.id) {
      throw new AppError('Bạn không thể tự khóa tài khoản của chính mình.', 400);
    }

    const status = z.nativeEnum(UserStatus).parse(req.body.status);
    const existing = await prisma.user.findFirst({ where: { id, role: Role.ADMIN } });
    if (!existing) throw new AppError('Không tìm thấy tài khoản quản trị viên.', 404);

    const admin = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, fullName: true, status: true },
    });

    return res.json({
      message: 'Cập nhật trạng thái quản trị viên thành công.',
      admin,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdminAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) throw new AppError('ID quản trị viên không hợp lệ.', 400);

    if (id === req.user!.id) {
      throw new AppError('Bạn không thể tự xóa tài khoản của chính mình.', 400);
    }

    const existing = await prisma.user.findFirst({ where: { id, role: Role.ADMIN } });
    if (!existing) throw new AppError('Không tìm thấy tài khoản quản trị viên.', 404);

    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'Đã xóa tài khoản quản trị viên.' });
  } catch (err) {
    next(err);
  }
}
