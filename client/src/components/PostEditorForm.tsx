import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload } from 'lucide-react';
import api from '../api/axios';
import TinyMCEEditor from './TinyMCEEditor';
import { Category, Post, PostStatus } from '../types';

interface PostEditorFormProps {
  apiBase: '/admin/posts' | '/users/posts';
  backPath: string;
  backLabel?: string;
}

export default function PostEditorForm({
  apiBase,
  backPath,
  backLabel = 'Quay lại danh sách',
}: PostEditorFormProps) {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [status, setStatus] = useState<PostStatus>('PUBLISHED');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ data: Category[] }>('/categories?all=true')
      .then((res) => {
        setCategories(res.data.data);
        if (!isEdit && res.data.data.length > 0) {
          setCategoryId(String(res.data.data[0].id));
        }
      })
      .catch(() => {});
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    api
      .get<{ post: Post }>(`${apiBase}/${id}`)
      .then((res) => {
        const p = res.data.post;
        setTitle(p.title);
        setSummary(p.summary || '');
        setContent(p.content);
        setThumbnail(p.thumbnail || '');
        setCategoryId(String(p.categoryId));
        setStatus(p.status);
      })
      .catch((err: any) => setError(err.response?.data?.message || 'Không tải được dữ liệu bài viết.'))
      .finally(() => setLoading(false));
  }, [apiBase, id, isEdit]);

  const handleUploadThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<{ url: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setThumbnail(res.data.url);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload ảnh bìa thất bại.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!content.trim()) {
      setError('Vui lòng nhập nội dung bài viết.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title,
        summary: summary || null,
        content,
        thumbnail: thumbnail || null,
        categoryId: Number(categoryId),
        status,
      };

      if (isEdit && id) {
        await api.put(`${apiBase}/${id}`, payload);
      } else {
        await api.post(apiBase, payload);
      }
      navigate(backPath);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lưu bài viết thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="py-10 text-slate-500">Đang tải thông tin bài viết...</div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> {backLabel}
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Chỉnh sửa bài viết' : 'Viết bài mới'}
          </h1>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tiêu đề bài viết <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề hấp dẫn..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Danh mục <span className="text-rose-500">*</span>
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-slate-900"
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Ảnh bìa (URL hoặc Tải lên)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="https://... hoặc bấm nút tải ảnh"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
              />
              <label className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-700 cursor-pointer shrink-0">
                <Upload className="w-4 h-4" />
                {uploading ? 'Đang tải...' : 'Tải ảnh'}
                <input type="file" accept="image/*" onChange={handleUploadThumbnail} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PostStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:border-slate-900"
            >
              <option value="PUBLISHED">Hiển thị công khai</option>
              <option value="HIDDEN">Ẩn bài viết</option>
              <option value="DRAFT">Lưu nháp</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả tóm tắt</label>
          <textarea
            rows={2}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Đoạn tóm tắt ngắn hiển thị ở danh sách bài viết..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Nội dung bài viết (TinyMCE Editor) <span className="text-rose-500">*</span>
          </label>
          <TinyMCEEditor value={content} onChange={setContent} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            to={backPath}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Hủy bỏ
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật bài viết' : 'Đăng bài viết'}
          </button>
        </div>
      </form>
    </div>
  );
}
