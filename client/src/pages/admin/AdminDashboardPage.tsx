import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EyeOff, FileText, FolderTree, MessageSquare, Plus, ShieldCheck, Users } from 'lucide-react';
import api from '../../api/axios';
import { PostStatus } from '../../types';

interface StatsResponse {
  stats: {
    totalPosts: number;
    publishedPosts: number;
    hiddenPosts: number;
    draftPosts: number;
    totalCategories: number;
    totalUsers: number;
    totalAdmins: number;
    totalComments: number;
  };
  recentPosts: {
    id: number;
    title: string;
    status: PostStatus;
    views: number;
    createdAt: string;
    category: { name: string };
  }[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<StatsResponse>('/admin/stats')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-slate-500 py-10">Đang tải thống kê hệ thống...</div>;
  }

  const stats = data?.stats;
  const cards = [
    {
      label: 'Tổng bài viết',
      value: stats?.totalPosts ?? 0,
      sub: `${stats?.publishedPosts ?? 0} đang hiển thị`,
      icon: FileText,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      label: 'Bài ẩn / Nháp',
      value: (stats?.hiddenPosts ?? 0) + (stats?.draftPosts ?? 0),
      sub: `${stats?.hiddenPosts ?? 0} ẩn · ${stats?.draftPosts ?? 0} nháp`,
      icon: EyeOff,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Danh mục',
      value: stats?.totalCategories ?? 0,
      sub: 'Chủ đề bài viết',
      icon: FolderTree,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Người dùng',
      value: stats?.totalUsers ?? 0,
      sub: `${stats?.totalComments ?? 0} bình luận`,
      icon: Users,
      color: 'bg-sky-50 text-sky-600',
    },
    {
      label: 'Quản trị viên',
      value: stats?.totalAdmins ?? 0,
      sub: 'Tài khoản Admin',
      icon: ShieldCheck,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      label: 'Bình luận',
      value: stats?.totalComments ?? 0,
      sub: 'Tương tác người đọc',
      icon: MessageSquare,
      color: 'bg-rose-50 text-rose-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tổng quan hệ thống</h1>
          <p className="text-sm text-slate-500">Theo dõi hoạt động và nội dung của PTIT Blog</p>
        </div>

        <Link
          to="/admin/posts/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-sm transition self-start"
        >
          <Plus className="w-4 h-4" />
          Viết bài mới
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${c.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500">{c.label}</p>
                <p className="text-2xl font-extrabold text-slate-900">{c.value}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Bài viết mới cập nhật</h2>
          <Link to="/admin/posts" className="text-sm font-medium text-indigo-600 hover:underline">
            Xem tất cả →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {data?.recentPosts.map((p) => (
            <div key={p.id} className="px-6 py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <Link
                  to={`/admin/posts/${p.id}/edit`}
                  className="font-semibold text-slate-800 hover:text-indigo-600 truncate block"
                >
                  {p.title}
                </Link>
                <p className="text-xs text-slate-500">
                  {p.category.name} · {new Date(p.createdAt).toLocaleDateString('vi-VN')} · {p.views} lượt xem
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${
                  p.status === 'PUBLISHED'
                    ? 'bg-emerald-50 text-emerald-700'
                    : p.status === 'HIDDEN'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.status === 'PUBLISHED' ? 'Hiển thị' : p.status === 'HIDDEN' ? 'Đang ẩn' : 'Nháp'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
