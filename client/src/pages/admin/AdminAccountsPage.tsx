import { useEffect, useState } from 'react';
import { KeyRound, Lock, Plus, Search, Trash2, Unlock, X } from 'lucide-react';
import api from '../../api/axios';
import Pagination from '../../components/Pagination';
import { useAuth } from '../../context/AuthContext';
import { PaginatedResponse, PaginationMeta, User } from '../../types';

export default function AdminAccountsPage() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState<User[]>([]);
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

  // Create Admin modal
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phoneNumber: '',
    address: '',
  });
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Update Password modal
  const [pwdAdmin, setPwdAdmin] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await api.get<PaginatedResponse<User>>('/admin/admins', {
        params: {
          page,
          limit: 10,
          search: search || undefined,
          status: status || undefined,
          sortBy,
          sortOrder,
        },
      });
      setAdmins(res.data.data);
      setPagination(res.data.pagination);
      if (res.data.data.length === 0 && page > 1 && res.data.pagination.totalItems > 0) {
        setPage(res.data.pagination.totalPages);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [page, search, status, sortBy, sortOrder]);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/admin/admins', createForm);
      setCreateOpen(false);
      setCreateForm({ fullName: '', email: '', password: '', phoneNumber: '', address: '' });
      fetchAdmins();
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Tạo tài khoản thất bại.');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdAdmin) return;
    setSavingPwd(true);
    setPwdError('');
    try {
      await api.patch(`/admin/admins/${pwdAdmin.id}/password`, { newPassword });
      setPwdAdmin(null);
      setNewPassword('');
      alert('Cập nhật mật khẩu quản trị viên thành công!');
    } catch (err: any) {
      setPwdError(err.response?.data?.message || 'Cập nhật mật khẩu thất bại.');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleToggleStatus = async (admin: User) => {
    const nextStatus = admin.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const actionLabel = nextStatus === 'BLOCKED' ? 'khóa' : 'mở khóa';
    if (!confirm(`Bạn chắc chắn muốn ${actionLabel} tài khoản "${admin.fullName}"?`)) return;
    try {
      await api.patch(`/admin/admins/${admin.id}/status`, { status: nextStatus });
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Cập nhật trạng thái thất bại.');
    }
  };

  const handleDelete = async (admin: User) => {
    if (!confirm(`Bạn chắc chắn muốn xóa tài khoản quản trị "${admin.fullName}"?`)) return;
    try {
      await api.delete(`/admin/admins/${admin.id}`);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý tài khoản quản trị viên</h1>
          <p className="text-sm text-slate-500">Thêm mới, cập nhật mật khẩu hoặc xóa tài khoản Admin</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setCreateError('');
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm self-start"
        >
          <Plus className="w-4 h-4" />
          Thêm quản trị viên
        </button>
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
                placeholder="Tìm theo tên, email, SĐT..."
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
            <option value="BLOCKED">Đã khóa</option>
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
            <option value="fullName:asc">Tên A → Z</option>
            <option value="email:asc">Email A → Z</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-4 py-3.5">Quản trị viên</th>
                <th className="px-4 py-3.5">Số bài đã đăng</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
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
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                    Không có tài khoản quản trị viên nào.
                  </td>
                </tr>
              ) : (
                admins.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">
                        {a.fullName}
                        {a.id === currentUser?.id && (
                          <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
                            Bạn
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">{a.email}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{a._count?.posts ?? 0} bài</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          a.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {a.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => {
                          setPwdAdmin(a);
                          setNewPassword('');
                          setPwdError('');
                        }}
                        className="p-2 rounded-lg text-amber-600 hover:bg-amber-50"
                        title="Cập nhật mật khẩu"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={a.id === currentUser?.id}
                        onClick={() => handleToggleStatus(a)}
                        className={`p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed ${
                          a.status === 'ACTIVE'
                            ? 'text-slate-600 hover:bg-slate-100'
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={
                          a.id === currentUser?.id
                            ? 'Không thể tự khóa chính mình'
                            : a.status === 'ACTIVE'
                            ? 'Khóa tài khoản'
                            : 'Mở khóa tài khoản'
                        }
                      >
                        {a.status === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        disabled={a.id === currentUser?.id}
                        onClick={() => handleDelete(a)}
                        className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-30 disabled:cursor-not-allowed"
                        title={a.id === currentUser?.id ? 'Không thể tự xóa chính mình' : 'Xóa quản trị viên'}
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

      {/* Create Admin Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Thêm quản trị viên mới</h2>
              <button type="button" onClick={() => setCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && <div className="p-3 rounded-xl bg-rose-50 text-sm text-rose-700">{createError}</div>}

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  minLength={6}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={createForm.phoneNumber}
                  onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {creating ? 'Đang tạo...' : 'Tạo Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {pwdAdmin && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Đổi mật khẩu Admin</h2>
              <button type="button" onClick={() => setPwdAdmin(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600">
              Cập nhật mật khẩu mới cho <strong>{pwdAdmin.fullName}</strong> ({pwdAdmin.email})
            </p>

            {pwdError && <div className="p-3 rounded-xl bg-rose-50 text-sm text-rose-700">{pwdError}</div>}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới *</label>
                <input
                  type="password"
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPwdAdmin(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingPwd}
                  className="px-5 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {savingPwd ? 'Đang lưu...' : 'Cập nhật mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
