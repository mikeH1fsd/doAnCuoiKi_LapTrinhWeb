import { PostStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { toSlug } from './slug';

export const safeThumbnailUrl = z
  .string()
  .trim()
  .max(1000)
  .refine(
    (val) => val === '' || /^https?:\/\//i.test(val) || val.startsWith('/uploads/'),
    'Đường dẫn ảnh bìa phải bắt đầu bằng http://, https:// hoặc /uploads/.'
  )
  .optional()
  .nullable();

export const postSchema = z.object({
  title: z.string().trim().min(3, 'Tiêu đề bài viết phải có ít nhất 3 ký tự.').max(255),
  summary: z.string().trim().max(500).optional().nullable(),
  content: z.string().trim().min(10, 'Nội dung bài viết quá ngắn.'),
  thumbnail: safeThumbnailUrl,
  categoryId: z.coerce.number().int().positive('Vui lòng chọn danh mục hợp lệ.'),
  status: z.nativeEnum(PostStatus).optional().default(PostStatus.PUBLISHED),
});

export async function generateUniquePostSlug(title: string, excludePostId?: number): Promise<string> {
  const baseSlug = toSlug(title) || `bai-viet-${Date.now()}`;
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing || existing.id === excludePostId) {
      return slug;
    }
    slug = `${baseSlug}-${counter++}`;
  }
}

export function buildPostListWhere(
  query: Record<string, unknown>,
  search: string,
  authorId?: number
): Prisma.PostWhereInput {
  const status =
    typeof query.status === 'string' && Object.values(PostStatus).includes(query.status as PostStatus)
      ? (query.status as PostStatus)
      : undefined;
  const categoryId = query.categoryId ? Number(query.categoryId) : undefined;

  const where: Prisma.PostWhereInput = {};

  if (authorId !== undefined) {
    where.authorId = authorId;
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { content: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (categoryId && !Number.isNaN(categoryId)) {
    where.categoryId = categoryId;
  }

  return where;
}
