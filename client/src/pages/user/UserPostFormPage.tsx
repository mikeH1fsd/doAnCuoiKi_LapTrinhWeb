import PostEditorForm from '../../components/PostEditorForm';

export default function UserPostFormPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <PostEditorForm
        apiBase="/users/posts"
        backPath="/my-posts"
        backLabel="Quay lại bài viết của tôi"
      />
    </div>
  );
}
