import { useEffect, useState } from 'react';
import { Edit, Plus, Search, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { Category, PaginatedResponse, PaginationMeta } from '../../types';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Query state
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [hasPosts, setHasPosts] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<Category>>('/admin/categories', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          hasPosts: hasPosts || undefined,
          sortBy,
          sortOrder,
        },
      });
      setCategories(res.data.data);
      setPagination(res.data.pagination);
      if (res.data.data.length === 0 && page > 1 && res.data.pagination.totalItems > 0) {
        setPage(res.data.pagination.totalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [page, search, hasPosts, sortBy, sortOrder]);

  const openCreateModal = () => {
    setEditing(null);
    setName('');
    setDescription('');
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditing(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setModalError('');
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, { name, description });
      } else {
        await api.post('/admin/categories', { name, description });
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (!confirm(`Bạn chắc chắn muốn xóa danh mục "${cat.name}"?`)) return;
    setErrorMsg('');
    try {
      await api.delete(`/admin/categories/${cat.id}`);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Không thể xóa danh mục.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý danh mục</h1>
          <p className="text-sm text-slate-500">Phân loại các chủ đề bài viết trên hệ thống</p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm self-start"
        >
          <Plus className="w-4 h-4" />
          Thêm danh mục
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {errorMsg}
        </div>
      )}

      {/* Search, Filter, Sort */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setSearch(searchInput.trim());
            }}
            className="md:col-span-6 flex gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm theo tên hoặc mô tả danh mục..."
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
            value={hasPosts}
            onChange={(e) => {
              setHasPosts(e.target.value);
              setPage(1);
            }}
            className="md:col-span-3 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="">Tất cả trạng thái bài</option>
            <option value="true">Đã có bài viết</option>
            <option value="false">Chưa có bài viết</option>
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
            <option value="createdAt:desc">Mới tạo nhất</option>
            <option value="createdAt:asc">Cũ nhất</option>
            <option value="name:asc">Tên A → Z</option>
            <option value="name:desc">Tên Z → A</option>
            <option value="postsCount:desc">Nhiều bài viết nhất</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Tên danh mục</th>
                <th className="px-4 py-3.5">Slug</th>
                <th className="px-4 py-3.5">Mô tả</th>
                <th className="px-4 py-3.5">Số bài viết</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Không có danh mục nào phù hợp.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{cat.name}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {cat._count?.posts ?? 0} bài
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(cat)}
                        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                        title="Sửa danh mục"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Xóa danh mục"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

      {/* Modal Add/Edit */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
              </h2>
              <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 text-sm text-rose-700">{modalError}</div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tên danh mục <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
