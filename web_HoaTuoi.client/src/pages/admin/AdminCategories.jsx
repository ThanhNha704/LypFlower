import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Image as ImageIcon } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { resolveImage } from '../../utils/imageResolver';

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  imageUrl: '',
};

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchCategories = () => {
    apiClient.get('/categories')
      .then(r => setCategories(r.data ?? []))
      .catch(() => toast.error('Lỗi tải danh mục'));
  };

  useEffect(() => { fetchCategories(); }, []);

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  function openCreate() { setForm(EMPTY_FORM); setEditId(null); setModal('edit'); }
  function openEdit(c) {
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      imageUrl: c.imageUrl ?? '',
    });
    setEditId(c.id);
    setModal('edit');
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm(f => {
      const next = { ...f, [name]: value };
      if (name === 'name' && !editId) next.slug = slugify(value);
      return next;
    });
  }

  async function handleSave() {
    if (!form.name || !form.slug) return toast.error('Vui lòng nhập Tên và Slug');
    setLoading(true);
    try {
      if (editId) {
        await apiClient.put(`/categories/${editId}`, form);
        toast.success('Cập nhật thành công!');
      } else {
        await apiClient.post('/categories', form);
        toast.success('Tạo danh mục thành công!');
      }
      setModal(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa danh mục "${name}"? Các sản phẩm thuộc danh mục này có thể bị ảnh hưởng.`)) return;
    try {
      await apiClient.delete(`/categories/${id}`);
      toast.success('Đã xóa danh mục');
      fetchCategories();
    } catch { toast.error('Không thể xóa danh mục này (có thể đang chứa sản phẩm)'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Quản lý Danh mục Hoa</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm shadow-sm hover:shadow-md transition">
          <Plus size={16} /> Thêm Danh mục
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm danh mục..." 
          className="input pl-9 text-sm focus:ring-amber-500/20" 
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Hình ảnh</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Tên danh mục</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Mô tả</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Slug</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCategories.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3">
                    {c.imageUrl ? (
                      <img src={resolveImage(c.imageUrl)} alt={c.name} className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-100 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center text-pink-200 border border-pink-100">
                        <ImageIcon size={20} />
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-bold text-gray-800">{c.name}</p>
                  </td>
                  <td className="px-5 py-3 text-gray-500 max-w-xs truncate">
                    {c.description || <span className="text-gray-300 italic">Trống</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                    {c.slug}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(c.id, c.name)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center">
                      <Search size={32} className="text-gray-200 mb-3" />
                      <p>Không tìm thấy danh mục nào</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal === 'edit' && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-900 mb-5">{editId ? 'Sửa Danh Mục' : 'Tạo Danh Mục Mới'}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Tên danh mục <span className="text-red-500">*</span></label>
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="VD: Hoa khai trương" className="input text-sm bg-gray-50/50 focus:bg-white transition-colors" />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Đường dẫn (Slug) <span className="text-red-500">*</span></label>
                <input name="slug" value={form.slug} onChange={handleFormChange} placeholder="VD: hoa-khai-truong" className="input text-sm font-mono text-gray-600 bg-gray-50/50 focus:bg-white transition-colors" />
                <p className="text-[10px] text-gray-400 mt-1 ml-1 leading-tight">Được sử dụng cho URL trang web. Sẽ tự động tạo từ tên nếu để trống khi tạo mới.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">URL Hình ảnh Cover</label>
                <input name="imageUrl" value={form.imageUrl} onChange={handleFormChange} placeholder="https://..." className="input text-sm bg-gray-50/50 focus:bg-white transition-colors" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Mô tả hiển thị</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Mô tả về ý nghĩa loại hoa này..." className="input text-sm resize-none bg-gray-50/50 focus:bg-white transition-colors" />
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                Hủy bỏ
              </button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Tạo mới')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
