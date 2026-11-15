import { useEffect, useState } from 'react';
import { KeyRound, Save, Upload, User as UserIcon } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    birthYear: '',
    phoneNumber: '',
    address: '',
    avatar: '',
  });
  const [infoMessage, setInfoMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwdMessage, setPwdMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.fullName || '',
        birthYear: user.birthYear ? String(user.birthYear) : '',
        phoneNumber: user.phoneNumber || '',
        address: user.address || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setInfoMessage(null);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<{ url: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfileForm((prev) => ({ ...prev, avatar: res.data.url }));
      setInfoMessage({ type: 'ok', text: 'Đã tải ảnh đại diện lên. Bấm "Lưu thay đổi" để cập nhật.' });
    } catch (err: any) {
      setInfoMessage({ type: 'err', text: err.response?.data?.message || 'Tải ảnh thất bại.' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setInfoMessage(null);
    setSavingInfo(true);
    try {
      const res = await api.put<{ message: string; user: User }>('/users/profile', {
        fullName: profileForm.fullName,
        birthYear: profileForm.birthYear ? Number(profileForm.birthYear) : null,
        phoneNumber: profileForm.phoneNumber || null,
        address: profileForm.address || null,
        avatar: profileForm.avatar || null,
      });
      setUser(res.data.user);
      setInfoMessage({ type: 'ok', text: res.data.message });
    } catch (err: any) {
      setInfoMessage({
        type: 'err',
        text: err.response?.data?.message || 'Cập nhật thất bại.',
      });
    } finally {
      setSavingInfo(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdMessage(null);
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMessage({ type: 'err', text: 'Mật khẩu xác nhận không khớp.' });
      return;
    }

    setSavingPwd(true);
    try {
      const res = await api.put<{ message: string }>('/users/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      setPwdMessage({ type: 'ok', text: res.data.message });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setPwdMessage({
        type: 'err',
        text: err.response?.data?.message || 'Đổi mật khẩu thất bại.',
      });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 font-bold text-2xl flex items-center justify-center shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
            ) : (
              user?.fullName?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{user?.fullName}</h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'info'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserIcon className="w-4 h-4" /> Thông tin liên hệ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'password'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-4 h-4" /> Đổi mật khẩu
          </button>
        </div>

        {/* Tab Info */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveInfo} className="pt-6 space-y-4">
            {infoMessage && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  infoMessage.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {infoMessage.text}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ và tên</label>
                <input
                  type="text"
                  value={profileForm.fullName}
                  onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Năm sinh</label>
                <input
                  type="number"
                  min={1920}
                  max={new Date().getFullYear()}
                  value={profileForm.birthYear}
                  onChange={(e) => setProfileForm({ ...profileForm, birthYear: e.target.value })}
                  placeholder="2004"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={profileForm.phoneNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                  placeholder="0912345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  placeholder="Hà Nội"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ảnh đại diện (URL hoặc Tải ảnh lên)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    placeholder="https://... hoặc bấm Tải ảnh"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 cursor-pointer shrink-0">
                    <Upload className="w-4 h-4" />
                    {uploadingAvatar ? 'Đang tải...' : 'Tải ảnh'}
                    <input type="file" accept="image/*" onChange={handleUploadAvatar} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={savingInfo}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition"
              >
                <Save className="w-4 h-4" />
                {savingInfo ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        )}

        {/* Tab Password */}
        {activeTab === 'password' && (
          <form onSubmit={handleChangePassword} className="pt-6 space-y-4 max-w-md">
            {pwdMessage && (
              <div
                className={`p-3 rounded-xl text-sm ${
                  pwdMessage.type === 'ok'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {pwdMessage.text}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu hiện tại</label>
              <input
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mới</label>
              <input
                type="password"
                minLength={6}
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Xác nhận mật khẩu mới</label>
              <input
                type="password"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={savingPwd}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50 transition"
            >
              <KeyRound className="w-4 h-4" />
              {savingPwd ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
