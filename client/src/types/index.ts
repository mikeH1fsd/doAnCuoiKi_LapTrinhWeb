export type Role = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type PostStatus = 'DRAFT' | 'PUBLISHED' | 'HIDDEN';

export interface User {
  id: number;
  email: string;
  fullName: string;
  birthYear?: number | null;
  address?: string | null;
  phoneNumber?: string | null;
  avatar?: string | null;
  role: Role;
  status: UserStatus;
  createdAt: string;
  _count?: {
    comments?: number;
    posts?: number;
  };
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  createdAt: string;
  _count?: {
    posts: number;
  };
}

export interface Post {
  id: number;
  title: string;
  slug: string;
  summary?: string | null;
  content: string;
  thumbnail?: string | null;
  status: PostStatus;
  views: number;
  authorId: number;
  categoryId: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: number;
    fullName: string;
    avatar?: string | null;
    email?: string;
  };
  category?: {
    id: number;
    name: string;
    slug: string;
  };
  _count?: {
    comments: number;
  };
}

export interface Comment {
  id: number;
  content: string;
  postId: number;
  userId: number;
  status: 'ACTIVE' | 'HIDDEN';
  createdAt: string;
  user: {
    id: number;
    fullName: string;
    avatar?: string | null;
    role: Role;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
