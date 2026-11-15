import { Link, Outlet, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, LogIn, LogOut, PenSquare, Shield, User as UserIcon, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa]">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center group-hover:bg-slate-800 transition">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">PTIT Blog</span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Trang chủ
            </Link>

            {user ? (
              <>
                <Link
                  to="/my-posts"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Bài viết của tôi</span>
                </Link>

                <Link
                  to="/write"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  <PenSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">Viết bài</span>
                </Link>

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition"
                  >
                    <Shield className="w-4 h-4" />
                    <span className="hidden sm:inline">Quản trị</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  <span className="max-w-[120px] truncate">{user.fullName}</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  title="Đăng xuất"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>
            © {new Date().getFullYear()} <strong className="text-slate-700">PTIT Blog</strong> — Đề tài số 5 môn Lập trình Web.
          </p>
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:text-indigo-600 transition">
              Bài viết
            </Link>
            <Link to="/admin/login" className="hover:text-indigo-600 transition">
              Cổng quản trị viên
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
