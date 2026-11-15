import { Request, Response, NextFunction } from 'express';
import { CommentStatus, PostStatus, Prisma, Role } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { formatPaginatedResponse, parseListQuery } from '../utils/pagination';
import { delCacheByPrefix, getCache, setCache } from '../utils/cache';
import { AppError } from '../middlewares/error.middleware';

const createCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(2, 'Nội dung bình luận phải có ít nhất 2 ký tự.')
    .max(2000, 'Bình luận tối đa 2000 ký tự.'),
});

export async function getPublicPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const { page, limit, skip, search, sortBy, sortOrder } = parseListQuery(
      req.query as Record<string, unknown>,
      ['createdAt', 'views', 'title'],
      'createdAt'
    );

    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;
    const categorySlug = typeof req.query.categorySlug === 'string' ? req.query.categorySlug.trim() : undefined;
    const fromDate = typeof req.query.fromDate === 'string' && req.query.fromDate ? new Date(req.query.fromDate) : undefined;
    const toDate = typeof req.query.toDate === 'string' && req.query.toDate ? new Date(req.query.toDate) : undefined;

    const where: Prisma.PostWhereInput = {
      status: PostStatus.PUBLISHED,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId && !Number.isNaN(categoryId)) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate && !Number.isNaN(fromDate.getTime())) {
        where.createdAt.gte = fromDate;
      }
      if (toDate && !Number.isNaN(toDate.getTime())) {
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt.lte = endOfDay;
      }
    }

    const [totalItems, posts] = await Promise.all([
      prisma.post.count({ where }),
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          title: true,
          slug: true,
          summary: true,
          thumbnail: true,
          views: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: { id: true, fullName: true, avatar: true },
          },
          category: {
            select: { id: true, name: true, slug: true },
          },
          _count: {
            select: {
              comments: { where: { status: CommentStatus.ACTIVE } },
            },
          },
        },
      }),
    ]);

    return res.json(formatPaginatedResponse(posts, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getPostBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = String(req.params.slug);
    const isPrefetch = req.query.prefetch === '1';
    const cacheKey = `post:slug:${slug}`;

    interface CachedPostPayload {
      post: Record<string, unknown> & { id: number; views: number };
      comments: unknown[];
      commentsPagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
      };
    }

    const cached = getCache<CachedPostPayload>(cacheKey);
    if (cached) {
      if (!isPrefetch) {
        cached.post.views += 1;
        prisma.post
          .update({ where: { id: cached.post.id }, data: { views: { increment: 1 } } })
          .catch(() => {});
      }
      return res.json(cached);
    }

    const postWithComments = await prisma.post.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
      include: {
        author: {
          select: { id: true, fullName: true, avatar: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: {
            comments: { where: { status: CommentStatus.ACTIVE } },
          },
        },
        comments: {
          where: { status: CommentStatus.ACTIVE },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            user: {
              select: { id: true, fullName: true, avatar: true, role: true },
            },
          },
        },
      },
    });

    if (!postWithComments) {
      throw new AppError('Không tìm thấy bài viết.', 404);
    }

    const { comments, ...post } = postWithComments;
    const totalComments = post._count.comments;

    if (!isPrefetch) {
      post.views += 1;
      prisma.post
        .update({ where: { id: post.id }, data: { views: { increment: 1 } } })
        .catch(() => {});
    }

    const payload: CachedPostPayload = {
      post,
      comments,
      commentsPagination: {
        page: 1,
        limit: 5,
        totalItems: totalComments,
        totalPages: Math.max(1, Math.ceil(totalComments / 5)),
      },
    };

    setCache(cacheKey, payload, 30_000);
    return res.json(payload);
  } catch (err) {
    next(err);
  }
}

export async function getPublicCategories(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.query.all === 'true') {
      const cachedCats = getCache<unknown[]>('categories:all');
      if (cachedCats) {
        return res.json({ data: cachedCats });
      }
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { posts: { where: { status: PostStatus.PUBLISHED } } },
          },
        },
      });
      setCache('categories:all', categories, 60_000);
      return res.json({ data: categories });
    }

    const { page, limit, skip, search, sortBy, sortOrder } = parseListQuery(
      req.query as Record<string, unknown>,
      ['name', 'createdAt'],
      'name'
    );

    const where: Prisma.CategoryWhereInput = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [totalItems, categories] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { posts: { where: { status: PostStatus.PUBLISHED } } },
          },
        },
      }),
    ]);

    return res.json(formatPaginatedResponse(categories, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function getPostComments(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) throw new AppError('ID bài viết không hợp lệ.', 400);

    const { page, limit, skip, search, sortBy, sortOrder } = parseListQuery(
      req.query as Record<string, unknown>,
      ['createdAt'],
      'createdAt'
    );

    const where: Prisma.CommentWhereInput = {
      postId,
      status: CommentStatus.ACTIVE,
    };

    if (search) {
      where.content = { contains: search, mode: 'insensitive' };
    }

    const [totalItems, comments] = await Promise.all([
      prisma.comment.count({ where }),
      prisma.comment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: { id: true, fullName: true, avatar: true, role: true },
          },
        },
      }),
    ]);

    return res.json(formatPaginatedResponse(comments, totalItems, page, limit));
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction) {
  try {
    const postId = Number(req.params.id);
    if (Number.isNaN(postId)) throw new AppError('ID bài viết không hợp lệ.', 400);

    const post = await prisma.post.findFirst({
      where: { id: postId, status: PostStatus.PUBLISHED },
    });
    if (!post) throw new AppError('Bài viết không tồn tại hoặc đã bị ẩn.', 404);

    const data = createCommentSchema.parse(req.body);
    const comment = await prisma.comment.create({
      data: {
        content: data.content,
        postId,
        userId: req.user!.id,
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatar: true, role: true },
        },
      },
    });

    delCacheByPrefix('post:slug:');

    return res.status(201).json({
      message: 'Bình luận thành công.',
      comment,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction) {
  try {
    const commentId = Number(req.params.id);
    if (Number.isNaN(commentId)) throw new AppError('ID bình luận không hợp lệ.', 400);

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new AppError('Không tìm thấy bình luận.', 404);

    if (comment.userId !== req.user!.id && req.user!.role !== Role.ADMIN) {
      throw new AppError('Bạn không có quyền xóa bình luận này.', 403);
    }

    await prisma.comment.delete({ where: { id: commentId } });
    delCacheByPrefix('post:slug:');
    return res.json({ message: 'Đã xóa bình luận.' });
  } catch (err) {
    next(err);
  }
}
