import { Editor } from '@tinymce/tinymce-react';
import api from '../api/axios';

interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  height?: number;
}

export default function TinyMCEEditor({ value, onChange, height = 460 }: TinyMCEEditorProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-300 bg-white">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        value={value}
        onEditorChange={(newContent) => onChange(newContent)}
        init={{
          height,
          menubar: true,
          plugins: [
            'advlist',
            'autolink',
            'lists',
            'link',
            'image',
            'charmap',
            'preview',
            'anchor',
            'searchreplace',
            'visualblocks',
            'code',
            'fullscreen',
            'insertdatetime',
            'media',
            'table',
            'help',
            'wordcount',
          ],
          toolbar:
            'undo redo | blocks | bold italic underline forecolor backcolor | ' +
            'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
            'link image table blockquote code | removeformat | fullscreen',
          content_style:
            'body { font-family: system-ui, -apple-system, sans-serif; font-size: 15px; line-height: 1.7; color: #1e293b; } img { max-width: 100%; height: auto; border-radius: 8px; }',
          images_upload_handler: async (blobInfo) => {
            const formData = new FormData();
            formData.append('image', blobInfo.blob(), blobInfo.filename());
            const res = await api.post<{ url: string }>('/upload', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            return res.data.url;
          },
          automatic_uploads: true,
          branding: false,
          promotion: false,
        }}
      />
    </div>
  );
}
