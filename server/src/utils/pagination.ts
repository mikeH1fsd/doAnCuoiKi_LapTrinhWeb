export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export function parseListQuery(
  query: Record<string, unknown>,
  allowedSortFields: string[],
  defaultSortBy = 'createdAt'
): PaginationParams {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const search = typeof query.search === 'string' ? query.search.trim() : '';

  const requestedSortBy = typeof query.sortBy === 'string' ? query.sortBy : defaultSortBy;
  const sortBy = allowedSortFields.includes(requestedSortBy) ? requestedSortBy : defaultSortBy;
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return { page, limit, skip, search, sortBy, sortOrder };
}

export function formatPaginatedResponse<T>(data: T[], totalItems: number, page: number, limit: number) {
  return {
    data,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    },
  };
}
