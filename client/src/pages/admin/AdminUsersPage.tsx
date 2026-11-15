import { useEffect, useState } from 'react';
import { Edit, Search, Trash2, X } from 'lucide-react';
import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { PaginatedResponse, PaginationMeta, User, UserStatus } from '../../types';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Edit modal
  const [editing, setEditing] = useState<User | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    birthYear: '',
    phoneNumber: '',
    address: '',
    status: 'ACTIVE' as UserStatus,
  });
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<User>>('/admin/users', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
        },
      });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
      if (res.data.data.length === 0 && page > 1 && res.data.pagination.totalItems > 0) {
        setPage(res.data.pagination.totalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search, status, sortBy, sortOrder]);

  const openEditModal = (u: User) => {
    setEditing(u);
    setForm({
      fullName: u.fullName,
      birthYear: u.birthYear ? String(u.birthYear) : '',
      phoneNumber: u.phoneNumber || '',
      address: u.address || '',
      status: u.status,
    });
    setModalError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setModalError('');
    try {
      await api.put(`/admin/users/${editing.id}`, {
        fullName: form.fullName,
        birthYear: form.birthYear ? Number(form.birthYear) : null,
        phoneNumber: form.phoneNumber || null,
        address: form.address || null,
        status: form.status,
      });
      setEditing(null);
      fetchUsers();
    } catch (err: any) {
      setModalError(err.response?.data?.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Bạn chắc chắn muốn xóa tài khoản "${u.fullName}" (${u.email})?`)) return;
    await api.delete(`/admin/users/${u.id}`);
    fetchUsers();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Quản lý tài khoản người dùng</h1>
        <p className="text-sm text-slate-500">Xem, chỉnh sửa thông tin, khóa hoặc xóa tài khoản thành viên</p>
      </div>

      {/* Filter bar */}
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
                placeholder="Tìm theo tên, email, SĐT, địa chỉ..."
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
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="md:col-span-3 px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="BLOCKED">Đã bị khóa</option>
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
            <option value="createdAt:desc">Đăng ký mới nhất</option>
            <option value="createdAt:asc">Đăng ký cũ nhất</option>
            <option value="fullName:asc">Tên A → Z</option>
            <option value="fullName:desc">Tên Z → A</option>
            <option value="birthYear:asc">Năm sinh tăng dần</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Người dùng</th>
                <th className="px-4 py-3.5">Năm sinh</th>
                <th className="px-4 py-3.5">Liên hệ</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Ngày tham gia</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{u.fullName}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{u.birthYear || '—'}</td>
                    <td className="px-4 py-3.5">
                      <p className="text-slate-700">{u.phoneNumber || '—'}</p>
                      <p className="text-xs text-slate-400 truncate max-w-[180px]">{u.address || ''}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditModal(u)}
                        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50"
                        title="Sửa thông tin"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                        title="Xóa tài khoản"
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

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Sửa thông tin người dùng</h2>
              <button type="button" onClick={() => setEditing(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && <div className="p-3 rounded-xl bg-rose-50 text-sm text-rose-700">{modalError}</div>}

            <form onSubmit={handleSave} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Năm sinh</label>
                  <input
                    type="number"
                    value={form.birthYear}
                    onChange={(e) => setForm({ ...form, birthYear: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as UserStatus })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="BLOCKED">Khóa tài khoản</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={form.phoneNumber}
                  onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
