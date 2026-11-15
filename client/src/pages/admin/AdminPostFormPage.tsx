import PostEditorForm from '../../components/PostEditorForm';

export default function AdminPostFormPage() {
  return <PostEditorForm apiBase="/admin/posts" backPath="/admin/posts" />;
}
