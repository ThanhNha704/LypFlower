// src/pages/admin/AdminBlog.jsx
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { resolveImage } from '../../utils/imageResolver';

const EMPTY_FORM = { title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', type: 'Blog', isPublished: true };

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

export default function AdminBlog() {
  const [posts, setPosts] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');

  const fetch = () => {
    apiClient.get(`/blog${typeFilter ? `?type=${typeFilter}` : ''}`)
      .then(r => setPosts(r.data.items ?? r.data ?? []))
   .catch(() => {});
  };

  useEffect(() => { fetch(); }, [typeFilter]);

  function openEdit(p) {
    setForm({ title: p.title, slug: p.slug, excerpt: p.excerpt ?? '', content: 'Đang tải nội dung...', coverImageUrl: p.coverImageUrl ?? '', type: p.type, isPublished: p.isPublished });
    setEditId(p.id); setModal('edit');
    apiClient.get(`/blog/${p.slug}`).then(r => setForm(f => ({ ...f, content: r.data.content ?? '' })));
  }

  function handleChange(e) {
    const { name, value, type: t, checked } = e.target;
    setForm(f => {
      const next = { ...f, [name]: t === 'checkbox' ? checked : value };
      if (name === 'title' && !editId) next.slug = slugify(value);
 return next;
    });
  }

  async function save() {
    setLoading(true);
    try {
      if (editId) await apiClient.put(`/blog/${editId}`, form);
      else await apiClient.post('/blog', form);
      toast.success(editId ? 'Cập nhật thành công' : 'Đăng bài thành công');
setModal(null); fetch();
    } catch { toast.error('Lỗi khi lưu bài'); }
    finally { setLoading(false); }
  }

  async function deletePost(id, title) {
    if (!confirm(`Xóa bài "${title}"?`)) return;
    try {
      await apiClient.delete(`/blog/${id}`);
 toast.success('Đã xóa'); fetch();
    } catch { toast.error('Không thể xóa'); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
    <h1 className="text-xl font-bold text-gray-900">Blog / Lookbook</h1>
        <button onClick={() => { setForm(EMPTY_FORM); setEditId(null); setModal('edit'); }}
          className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Đăng bài mới
  </button>
</div>

      <div className="flex gap-2">
 {[['', 'Tất cả'], ['Blog', '📝 Blog'], ['Lookbook', '✨ Lookbook']].map(([k, l]) => (
          <button key={k} onClick={() => setTypeFilter(k)}
    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
    ${typeFilter === k ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
     {l}
          </button>
        ))}
      </div>

 <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(p => (
      <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
  <img src={resolveImage(p.coverImageUrl)} alt={p.title} className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {p.type}
   </span>
 </div>
         <div className="p-4 space-y-2">
          <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm">{p.title}</h3>
       <p className="text-xs text-gray-400 line-clamp-2">{p.excerpt}</p>
     <div className="flex items-center justify-between pt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {p.isPublished ? 'Đã đăng' : 'Nháp'}
    </span>
       <div className="flex gap-1">
      <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
       <Pencil size={14} />
        </button>
          <button onClick={() => deletePost(p.id, p.title)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
      <Trash2 size={14} />
        </button>
  </div>
              </div>
      </div>
      </div>
        ))}
        {posts.length === 0 && (
          <div className="col-span-3 text-center py-16 text-gray-400">
        <p className="text-4xl mb-3">📝</p><p>Chưa có bài viết nào</p>
          </div>
        )}
      </div>

    {/* Modal */}
      {modal === 'edit' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl space-y-4 my-4">
       <h2 className="font-bold text-gray-900 text-lg">{editId ? 'Chỉnh sửa bài' : 'Đăng bài mới'}</h2>
            {[
              { name: 'title', label: 'Tiêu đề *' },
       { name: 'slug', label: 'Slug URL *' },
      { name: 'coverImageUrl', label: 'URL ảnh bìa' },
   { name: 'excerpt', label: 'Tóm tắt' },
       ].map(f => (
  <div key={f.name}>
  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                <input name={f.name} value={form[f.name]} onChange={handleChange} className="input text-sm" />
     </div>
          ))}
        <div>
       <label className="block text-xs font-medium text-gray-600 mb-1">Nội dung (HTML)</label>
 <textarea name="content" value={form.content} onChange={handleChange} rows={6} className="input text-sm font-mono resize-none" />
            </div>
   <div className="flex items-center gap-6">
              <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Loại</label>
    <select name="type" value={form.type} onChange={handleChange} className="input text-sm w-36">
 <option value="Blog">Blog</option>
                  <option value="Lookbook">Lookbook</option>
         </select>
      </div>
   <div className="flex items-center gap-2 mt-4">
          <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="accent-amber-500 w-4 h-4" id="pub" />
      <label htmlFor="pub" className="text-sm text-gray-700">Đăng công khai</label>
       </div>
            </div>
            <div className="flex gap-3">
    <button onClick={() => setModal(null)} className="flex-1 btn-outline">Hủy</button>
     <button onClick={save} disabled={loading} className="flex-1 btn-primary">
        {loading ? 'Đang lưu...' : 'Lưu bài'}
  </button>
 </div>
      </div>
        </div>
 )}
    </div>
  );
}
