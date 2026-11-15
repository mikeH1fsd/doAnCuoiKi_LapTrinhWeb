import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { ArrowLeft, Calendar, Eye, MessageSquare, Search, Send, Trash2, User as UserIcon } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Pagination from '../../components/Pagination';
import { Comment, PaginatedResponse, PaginationMeta, Post } from '../../types';

export default function PostDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const location = useLocation();
  const previewPost = (location.state as { previewPost?: Post } | null)?.previewPost;
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(previewPost ?? null);
  const [loading, setLoading] = useState(!previewPost);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState('');

  // Comments state (with search, sort, pagination)
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentMeta, setCommentMeta] = useState<PaginationMeta>({
    page: 1,
    limit: 5,
    totalItems: previewPost?._count?.comments ?? 0,
    totalPages: 1,
  });
  const [commentPage, setCommentPage] = useState(1);
  const [commentSearch, setCommentSearch] = useState('');
  const [commentSortOrder, setCommentSortOrder] = useState<'desc' | 'asc'>('desc');
  const [commentsQueryTouched, setCommentsQueryTouched] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentError, setCommentError] = useState('');

  useEffect(() => {
    let active = true;
    if (!previewPost || previewPost.slug !== slug) {
      setLoading(true);
      setPost(null);
    } else {
      setPost(previewPost);
      setLoading(false);
    }
    setContentLoading(true);
    setError('');
    setCommentsQueryTouched(false);
    setCommentPage(1);
    setCommentSearch('');
    setCommentSortOrder('desc');

    api
      .get<{ post: Post; comments?: Comment[]; commentsPagination?: PaginationMeta }>(`/posts/${slug}`)
      .then((res) => {
        if (!active) return;
        setPost(res.data.post);
        if (res.data.comments) {
          setComments(res.data.comments);
        }
        if (res.data.commentsPagination) {
          setCommentMeta(res.data.commentsPagination);
        }
      })
      .catch(() => {
        if (!active) return;
        setError('Bài viết không tồn tại hoặc đã bị ẩn.');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
        setContentLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const fetchComments = async (postId: number) => {
    const res = await api.get<PaginatedResponse<Comment>>(`/posts/${postId}/comments`, {
      params: {
        page: commentPage,
        limit: 5,
        search: commentSearch || undefined,
        sortBy: 'createdAt',
        sortOrder: commentSortOrder,
      },
    });
    setComments(res.data.data);
    setCommentMeta(res.data.pagination);
    if (res.data.data.length === 0 && commentPage > 1 && res.data.pagination.totalItems > 0) {
      setCommentPage(res.data.pagination.totalPages);
    }
  };

  useEffect(() => {
    if (!post?.id || !commentsQueryTouched) return;
    fetchComments(post.id).catch(() => {});
  }, [post?.id, commentsQueryTouched, commentPage, commentSearch, commentSortOrder]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post || !newComment.trim()) return;
    setSubmitting(true);
    setCommentError('');
    try {
      await api.post(`/posts/${post.id}/comments`, { content: newComment.trim() });
      setNewComment('');
      setCommentPage(1);
      await fetchComments(post.id);
    } catch (err: any) {
      setCommentError(err.response?.data?.message || 'Không thể gửi bình luận.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!post || !confirm('Bạn chắc chắn muốn xóa bình luận này?')) return;
    await api.delete(`/comments/${commentId}`);
    await fetchComments(post.id);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        Đang tải nội dung bài viết...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-800">{error || 'Không tìm thấy bài viết'}</h1>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" /> Quay về trang chủ
        </Link>
      </div>
    );
  }

  // Làm sạch HTML từ TinyMCE bằng DOMPurify trước khi dùng dangerouslySetInnerHTML
  const sanitizedContent = post.content ? DOMPurify.sanitize(post.content) : '';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách bài viết
      </Link>

      {/* Post Article */}
      <article className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {post.thumbnail && (
          <div className="aspect-[16/8] w-full bg-slate-100">
            <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 sm:p-10 space-y-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
              {post.category?.name}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserIcon className="w-4 h-4" /> {post.author?.fullName}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {new Date(post.createdAt).toLocaleDateString('vi-VN')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Eye className="w-4 h-4" /> {post.views} lượt xem
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            {post.title}
          </h1>

          {post.summary && (
            <p className="text-lg text-slate-600 leading-relaxed border-l-4 border-indigo-500 pl-4 italic">
              {post.summary}
            </p>
          )}

          <hr className="border-slate-200" />

          {/* Render HTML an toàn với dangerouslySetInnerHTML + DOMPurify */}
          {contentLoading && !post.content ? (
            <div className="space-y-3 animate-pulse py-4">
              <div className="h-4 bg-slate-200 rounded w-full" />
              <div className="h-4 bg-slate-200 rounded w-11/12" />
              <div className="h-4 bg-slate-200 rounded w-4/5" />
            </div>
          ) : (
            <div
              className="prose prose-slate prose-lg max-w-none prose-img:rounded-xl prose-a:text-indigo-600"
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}
        </div>
      </article>

      {/* Comments Section */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            Bình luận ({commentMeta.totalItems})
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={commentSearch}
                onChange={(e) => {
                  setCommentSearch(e.target.value);
                  setCommentPage(1);
                  setCommentsQueryTouched(true);
                }}
                placeholder="Tìm bình luận..."
                className="pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={commentSortOrder}
              onChange={(e) => {
                setCommentSortOrder(e.target.value as 'asc' | 'desc');
                setCommentPage(1);
                setCommentsQueryTouched(true);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="desc">Mới nhất</option>
              <option value="asc">Cũ nhất</option>
            </select>
          </div>
        </div>

        {/* Add Comment Form */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={`Chia sẻ cảm nghĩ của bạn với tư cách ${user.fullName}...`}
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            {commentError && <p className="text-sm text-rose-600">{commentError}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50 transition"
              >
                <Send className="w-4 h-4" />
                {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
              </button>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Vui lòng đăng nhập tài khoản để tham gia bình luận dưới bài viết này.
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition"
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-100 transition"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        )}

        {/* Comment List */}
        <div className="space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                      {c.user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{c.user.fullName}</span>
                      {c.user.role === 'ADMIN' && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          ADMIN
                        </span>
                      )}
                      <p className="text-xs text-slate-400">
                        {new Date(c.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  {(user?.id === c.userId || user?.role === 'ADMIN') && (
                    <button
                      type="button"
                      onClick={() => handleDeleteComment(c.id)}
                      title="Xóa bình luận"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-line">{c.content}</p>
              </div>
            ))
          )}
        </div>

        <Pagination
          pagination={commentMeta}
          onPageChange={(p) => {
            setCommentPage(p);
            setCommentsQueryTouched(true);
          }}
        />
      </section>
    </div>
  );
}
