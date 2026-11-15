import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit, Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { Category, PaginatedResponse, PaginationMeta, Post, PostStatus } from '../../types';

export default function AdminPostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get<{ data: Category[] }>('/categories?all=true')
      .then((res) => setCategories(res.data.data))
      .catch(() => {});
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Post>>('/admin/posts', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          categoryId: categoryId || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
        },
      });
      setPosts(res.data.data);
      setPagination(res.data.pagination);
      if (res.data.data.length === 0 && page > 1 && res.data.pagination.totalItems > 0) {
        setPage(res.data.pagination.totalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page, search, categoryId, status, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleToggleVisibility = async (post: Post) => {
    const nextStatus: PostStatus = post.status === 'PUBLISHED' ? 'HIDDEN' : 'PUBLISHED';
    await api.patch(`/admin/posts/${post.id}/status`, { status: nextStatus });
    fetchPosts();
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Bạn chắc chắn muốn xóa bài viết "${post.title}"?`)) return;
    await api.delete(`/admin/posts/${post.id}`);
    fetchPosts();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý bài viết</h1>
          <p className="text-sm text-slate-500">Thêm, sửa, xóa và ẩn/hiện bài viết trên hệ thống</p>
        </div>

        <Link
          to="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition self-start"
        >
          <Plus className="w-4 h-4" />
          Thêm bài viết
        </Link>
      </div>

      {/* Filter, Search, Sort bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <form onSubmit={handleSearch} className="md:col-span-5 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tiêu đề, nội dung..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium"
            >
              Tìm
            </button>
          </form>

          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
            className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="md:col-span-2 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PUBLISHED">Đang hiển thị</option>
            <option value="HIDDEN">Đang ẩn</option>
            <option value="DRAFT">Bản nháp</option>
          </select>

          <select
            value={`${sortBy}:${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split(':');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
              setPage(1);
            }}
            className="md:col-span-3 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="createdAt:desc">Mới nhất</option>
            <option value="createdAt:asc">Cũ nhất</option>
            <option value="views:desc">Lượt xem nhiều nhất</option>
            <option value="title:asc">Tiêu đề A → Z</option>
            <option value="title:desc">Tiêu đề Z → A</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Bài viết</th>
                <th className="px-4 py-3.5">Tác giả</th>
                <th className="px-4 py-3.5">Danh mục</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Lượt xem</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Không có bài viết nào phù hợp.
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 max-w-xs">
                      <p className="font-semibold text-slate-900 line-clamp-1">{post.title}</p>
                      <p className="text-xs text-slate-400 truncate">/{post.slug}</p>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                      {post.author?.fullName || '—'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {post.category?.name}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          post.status === 'PUBLISHED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : post.status === 'HIDDEN'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {post.status === 'PUBLISHED'
                          ? 'Hiển thị'
                          : post.status === 'HIDDEN'
                          ? 'Đang ẩn'
                          : 'Bản nháp'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{post.views}</td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(post)}
                          title={post.status === 'PUBLISHED' ? 'Ẩn bài viết' : 'Hiển thị bài viết'}
                          className={`p-2 rounded-lg transition ${
                            post.status === 'PUBLISHED'
                              ? 'text-amber-600 hover:bg-amber-50'
                              : 'text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {post.status === 'PUBLISHED' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <Link
                          to={`/admin/posts/${post.id}/edit`}
                          title="Chỉnh sửa"
                          className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(post)}
                          title="Xóa bài viết"
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 pb-4">
          <Pagination pagination={pagination} onPageChange={(p) => setPage(p)} />
        </div>
      </div>
    </div>
  );
}
