import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Filter, MessageSquare, RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { Category, PaginatedResponse, PaginationMeta, Post } from '../../types';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 6,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  // Filters, search, sort, pagination state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);

  useEffect(() => {
    api
      .get<{ data: Category[] }>('/categories?all=true')
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get<PaginatedResponse<Post>>('/posts', {
        params: {
          page,
          limit,
          search: search || undefined,
          categoryId: categoryId || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
          sortBy,
          sortOrder,
        },
      })
      .then((res) => {
        if (!active) return;
        setPosts(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, limit, search, categoryId, fromDate, toDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategoryId('');
    setFromDate('');
    setToDate('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    const [field, order] = value.split(':');
    setSortBy(field);
    setSortOrder(order as 'asc' | 'desc');
    setPage(1);
  };

  const prefetchedSlugs = useRef(new Set<string>());
  const prefetchPost = (slug: string) => {
    if (prefetchedSlugs.current.has(slug)) return;
    prefetchedSlugs.current.add(slug);
    api.get(`/posts/${slug}?prefetch=1`).catch(() => {});
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Top Search & Category Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => {
              setCategoryId('');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
              categoryId === ''
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            Tất cả
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setCategoryId(String(cat.id));
                setPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                categoryId === String(cat.id)
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {cat.name}
              {typeof cat._count?.posts === 'number' && (
                <span className="ml-1.5 opacity-70 text-xs">({cat._count.posts})</span>
              )}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="w-full md:w-[320px] flex gap-2 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm tiêu đề, nội dung..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium transition shrink-0"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* Filter & Sort Bar */}
      <section className="bg-white rounded-xl border border-slate-200 p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Từ ngày
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Đến ngày
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Sắp xếp
            </label>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-slate-900"
            >
              <option value="createdAt:desc">Mới nhất trước</option>
              <option value="createdAt:asc">Cũ nhất trước</option>
              <option value="views:desc">Lượt xem nhiều nhất</option>
              <option value="title:asc">Tiêu đề (A → Z)</option>
              <option value="title:desc">Tiêu đề (Z → A)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Hiển thị</label>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:border-slate-900"
            >
              <option value={6}>6 bài / trang</option>
              <option value={9}>9 bài / trang</option>
              <option value={12}>12 bài / trang</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Đặt lại bộ lọc
          </button>
        </div>
      </section>

      {/* Posts Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
              <div className="h-48 bg-slate-200" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-6 w-full bg-slate-200 rounded" />
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <p className="text-lg font-semibold text-slate-700">Không tìm thấy bài viết phù hợp</p>
          <p className="text-sm text-slate-500">
            Hãy thử đổi từ khóa tìm kiếm hoặc đặt lại bộ lọc danh mục/ngày đăng.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
          >
            Xem tất cả bài viết
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                onMouseEnter={() => prefetchPost(post.slug)}
                className="group bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition flex flex-col"
              >
                <Link
                  to={`/posts/${post.slug}`}
                  state={{ previewPost: post }}
                  className="block aspect-[16/10] bg-slate-100 overflow-hidden"
                >
                  {post.thumbnail ? (
                    <img
                      src={post.thumbnail}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 font-bold text-xl">
                      PTIT Blog
                    </div>
                  )}
                </Link>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                      {post.category?.name}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <Link to={`/posts/${post.slug}`} state={{ previewPost: post }}>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-slate-600 transition line-clamp-2 mb-2">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="text-sm text-slate-600 line-clamp-3 mb-4 flex-1">
                    {post.summary || 'Nhấp vào để đọc toàn bộ nội dung chi tiết bài viết...'}
                  </p>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium text-slate-700 truncate max-w-[140px]">
                      {post.author?.fullName}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {post.views}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {post._count?.comments ?? 0}
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
        </>
      )}
    </div>
  );
}
