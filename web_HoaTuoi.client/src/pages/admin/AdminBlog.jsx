// src/pages/admin/AdminBlog.jsx
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Upload, X, ImageIcon } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { resolveImage } from '../../utils/imageResolver';

// type: 0 = Blog, 1 = Lookbook, 2 = Chăm sóc hoa
const EMPTY_FORM = { title: '', slug: '', excerpt: '', content: '', coverImageUrl: '', type: 0, isPublished: true };

const TYPE_LABELS = { 0: 'Blog', 1: 'Lookbook', 2: 'Chăm sóc hoa' };
const TYPE_FILTER_OPTIONS = [['', 'Tất cả'], ['0', '📝 Blog'], ['1', '✨ Lookbook'], ['2', '🌿 Chăm sóc hoa']];

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
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchPosts = () => {
    apiClient.get(`/blog${typeFilter !== '' ? `?type=${typeFilter}` : ''}`)
      .then(r => setPosts(r.data.items ?? r.data ?? []))
      .catch(() => {});
  };

  useEffect(() => { fetchPosts(); }, [typeFilter]); // eslint-disable-line

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setModal('edit');
  }

  function openEdit(p) {
    setForm({
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt ?? '',
      content: 'Đang tải nội dung...',
      coverImageUrl: p.coverImageUrl ?? '',
      type: typeof p.type === 'number' ? p.type : 0,
      isPublished: p.isPublished
    });
    setEditId(p.id);
    setModal('edit');
    apiClient.get(`/blog/${p.slug}`).then(r => setForm(f => ({ ...f, content: r.data.content ?? '' })));
  }

  function handleChange(e) {
    const { name, value, type: t, checked } = e.target;
    setForm(f => {
      const next = { ...f, [name]: t === 'checkbox' ? checked : (name === 'type' ? Number(value) : value) };
      if (name === 'title' && !editId) next.slug = slugify(value);
      return next;
    });
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImage(true);
    try {
      const res = await apiClient.post('/blog/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, coverImageUrl: res.data.url }));
      toast.success('Tải ảnh bìa lên thành công!');
    } catch {
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setUploadingImage(false);
    }
  }

  async function save() {
    if (!form.title.trim()) return toast.error('Vui lòng nhập tiêu đề bài viết!');
    if (!form.slug.trim()) return toast.error('Vui lòng nhập slug URL!');
    setLoading(true);
    try {
      const payload = { ...form, type: Number(form.type) };
      if (editId) await apiClient.put(`/blog/${editId}`, payload);
      else await apiClient.post('/blog', payload);
      toast.success(editId ? 'Cập nhật thành công' : 'Đăng bài thành công!');
      setModal(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Lỗi khi lưu bài');
    } finally {
      setLoading(false);
    }
  }

  async function deletePost(id, title) {
    if (!confirm(`Xóa bài "${title}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await apiClient.delete(`/blog/${id}`);
      toast.success('Đã xóa bài viết');
      fetchPosts();
    } catch { toast.error('Không thể xóa bài viết'); }
  }

  async function togglePublish(p) {
    try {
      const detail = await apiClient.get(`/blog/${p.slug}`);
      await apiClient.put(`/blog/${p.id}`, { ...detail.data, isPublished: !p.isPublished, excerpt: detail.data.summary ?? '', coverImageUrl: detail.data.coverImageUrl ?? '', type: p.type });
      fetchPosts();
      toast.success(!p.isPublished ? 'Đã đăng bài' : 'Đã chuyển sang nháp');
    } catch { toast.error('Không thể thay đổi trạng thái'); }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Blog / Lookbook</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={16} /> Đăng bài mới
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TYPE_FILTER_OPTIONS.map(([k, l]) => (
          <button key={k} onClick={() => setTypeFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${typeFilter === k ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {l}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-gray-100 relative overflow-hidden">
              {p.coverImageUrl ? (
                <img src={resolveImage(p.coverImageUrl)} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <ImageIcon size={32} />
                </div>
              )}
              <span className="absolute top-2 left-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {TYPE_LABELS[p.type] ?? 'Blog'}
              </span>
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm">{p.title}</h3>
              <p className="text-xs text-gray-400 line-clamp-2">{p.excerpt}</p>
              <div className="flex items-center justify-between pt-1">
                <button onClick={() => togglePublish(p)}
                  className={`text-xs font-medium px-2 py-0.5 rounded-full cursor-pointer transition-colors ${p.isPublished ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {p.isPublished ? '✓ Đã đăng' : '○ Nháp'}
                </button>
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

      {modal === 'edit' && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl space-y-4 my-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900 text-lg">{editId ? 'Chỉnh sửa bài viết' : 'Đăng bài mới'}</h2>
              <button onClick={() => setModal(null)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Tiêu đề <span className="text-red-500">*</span></label>
              <input name="title" value={form.title} onChange={handleChange} placeholder="Nhập tiêu đề bài viết..." className="input text-sm" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Slug URL <span className="text-red-500">*</span></label>
              <input name="slug" value={form.slug} onChange={handleChange} placeholder="slug-bai-viet" className="input text-sm font-mono" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 ml-1">Ảnh bìa</label>
              <div className="flex gap-3 items-start">
                {form.coverImageUrl ? (
                  <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                    <img src={resolveImage(form.coverImageUrl)} alt="Ảnh bìa" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, coverImageUrl: '' }))}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow hover:scale-110 transition-transform">
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="w-28 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 flex-shrink-0">
                    <ImageIcon size={24} />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <label className={`flex items-center gap-2 cursor-pointer w-full py-2.5 px-4 rounded-xl border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 hover:border-amber-300 transition-all ${uploadingImage ? 'opacity-60 pointer-events-none' : ''}`}>
                    <Upload size={15} />
                    {uploadingImage ? 'Đang tải ảnh...' : 'Tải ảnh lên từ máy tính'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                  <input name="coverImageUrl" value={form.coverImageUrl} onChange={handleChange}
                    placeholder="Hoặc nhập URL ảnh (https://...)" className="input text-xs text-gray-500" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Tóm tắt</label>
              <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={2} placeholder="Mô tả ngắn về bài viết..." className="input text-sm resize-none" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Nội dung (HTML)</label>
              <textarea name="content" value={form.content} onChange={handleChange} rows={8} className="input text-sm font-mono resize-y text-[11px] leading-relaxed" placeholder="<p>Nội dung bài viết...</p>" />
            </div>

            <div className="flex items-center gap-6 pt-1">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Phân loại</label>
                <select name="type" value={form.type} onChange={handleChange} className="input text-sm w-44">
                  <option value={0}>📝 Blog</option>
                  <option value={1}>✨ Lookbook</option>
                  <option value={2}>🌿 Chăm sóc hoa</option>
                </select>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={handleChange} className="accent-amber-500 w-4 h-4" id="pub" />
                <label htmlFor="pub" className="text-sm font-medium text-gray-700">Đăng công khai ngay</label>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={save} disabled={loading || uploadingImage} className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Đang lưu...' : (editId ? 'Cập nhật bài' : 'Đăng bài ngay')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
