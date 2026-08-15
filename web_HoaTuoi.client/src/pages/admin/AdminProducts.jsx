// src/pages/admin/AdminProducts.jsx
import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Image } from 'lucide-react';
import apiClient from '../../api/client';
import { formatVnd } from '../../utils/format';
import { resolveImage } from '../../utils/imageResolver';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '', slug: '', description: '', price: '', salePrice: '', isOnSale: false,
  categoryId: '', flowerType: '', occasion: '', color: '',
  bouquetSize: '', meaning: '', weightKg: '', stock: '',
  mainImageUrl: '',
};

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  const PAGE_SIZE = 10;

  const fetchProducts = () => {
    apiClient.get(`/products?page=${page}&pageSize=${PAGE_SIZE}${search ? `&q=${search}` : ''}`)
      .then(r => { setProducts(r.data.items ?? []); setTotal(r.data.total ?? 0); })
      .catch(() => {});
  };

  useEffect(() => { fetchProducts(); }, [page, search]);
  useEffect(() => {
    apiClient.get('/categories').then(r => setCategories(r.data ?? [])).catch(() => {});
  }, []);

  function openCreate() { setForm(EMPTY_FORM); setEditId(null); setModal('edit'); }
  function openEdit(p) {
    setForm({
      name: p.name, slug: p.slug, description: p.description ?? '',
      price: p.price, salePrice: p.salePrice ?? '', isOnSale: p.isOnSale,
      categoryId: p.categoryId ?? '', flowerType: p.flowerType ?? '', occasion: p.occasion ?? '',
      color: p.color ?? '', bouquetSize: p.bouquetSize ?? '', meaning: p.meaning ?? '',
      weightKg: p.weightKg ?? '', stock: p.stock,
      mainImageUrl: p.mainImageUrl,
    });
    setEditId(p.id);
    setModal('edit');
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => {
      const next = { ...f, [name]: type === 'checkbox' ? checked : value };
      if (name === 'name' && !editId) next.slug = slugify(value);
      return next;
  });
  }

  async function handleSave() {
    setLoading(true);
    try {
      const payload = {
        ...form,
        price: form.price ? Number(form.price) : 0,
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        categoryId: form.categoryId ? Number(form.categoryId) : 0,
        stock: form.stock !== null && form.stock !== undefined && form.stock !== '' ? Number(form.stock) : 0,
        weightKg: form.weightKg ? Number(form.weightKg) : null,
      };
      if (editId) await apiClient.put(`/products/${editId}`, payload);
      else await apiClient.post('/products', payload);
      toast.success(editId ? 'Cập nhật thành công!' : 'Tạo sản phẩm thành công!');
      setModal(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally {
 setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Xóa sản phẩm "${name}"?`)) return;
    try {
      await apiClient.delete(`/products/${id}`);
      toast.success('Đã xóa sản phẩm');
      fetchProducts();
    } catch { toast.error('Không thể xóa'); }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
     <h1 className="text-xl font-bold text-gray-900">Quản lý sản phẩm</h1>
  <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
    <Plus size={16} /> Thêm sản phẩm
  </button>
     </div>

    {/* Search */}
      <div className="relative max-w-sm">
<Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
     <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
       placeholder="Tìm kiếm sản phẩm..." className="input pl-9 text-sm" />
</div>

    {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
     <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Sản phẩm', 'Danh mục', 'Giá', 'Tồn kho', 'Trạng thái', ''].map(h => (
   <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
         ))}
  </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
         {products.map(p => (
  <tr key={p.id} className="hover:bg-gray-50">
      <td className="px-5 py-3">
 <div className="flex items-center gap-3">
      <img src={resolveImage(p.mainImageUrl)} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-gray-100 flex-shrink-0" />
   <div>
   <p className="font-medium text-gray-800 line-clamp-1">{p.name}</p>
    <p className="text-xs text-gray-400">{p.slug}</p>
    </div>
  </div>
  </td>
   <td className="px-5 py-3 text-gray-500">{p.category?.name}</td>
     <td className="px-5 py-3">
    {p.isOnSale && p.salePrice ? (
 <div>
  <span className="font-semibold text-red-600">{formatVnd(p.salePrice)}</span>
     <span className="text-gray-400 line-through text-xs ml-1">{formatVnd(p.price)}</span>
 </div>
     ) : <span className="font-semibold text-gray-800">{formatVnd(p.price)}</span>}
  </td>
  <td className="px-5 py-3">
<span className={`font-medium ${p.stock <= 5 ? 'text-red-500' : 'text-gray-700'}`}>{p.stock}</span>
 </td>
  <td className="px-5 py-3">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
    {p.isActive !== false ? 'Đang bán' : 'Ẩn'}
     </span>
  </td>
     <td className="px-5 py-3">
     <div className="flex items-center gap-1">
   <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
   <Pencil size={15} />
   </button>
 <button onClick={() => handleDelete(p.id, p.name)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
      <Trash2 size={15} />
     </button>
  </div>
  </td>
</tr>
  ))}
  {products.length === 0 && (
    <tr><td colSpan={6} className="text-center py-12 text-gray-400">Chưa có sản phẩm nào</td></tr>
           )}
  </tbody>
          </table>
        </div>

      {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
         {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
      <button key={p} onClick={() => setPage(p)}
          className={`w-8 h-8 rounded-lg text-xs font-medium ${p === page ? 'bg-amber-500 text-white' : 'border border-gray-200 hover:border-amber-400'}`}>
     {p}
         </button>
    ))}
          </div>
        )}
      </div>

    {/* Modal Create/Edit */}
      {modal === 'edit' && (
   <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
       <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5">
      <h2 className="text-lg font-bold text-gray-900">{editId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h2>

  <div className="grid grid-cols-2 gap-4">
      {[
        { name: 'name', label: 'Tên sản phẩm *', col: 2 },
        { name: 'slug', label: 'Slug URL *', col: 2 },
        { name: 'price', label: 'Giá gốc (VNĐ) *', type: 'number' },
        { name: 'salePrice', label: 'Giá sale (VNĐ)', type: 'number' },
        { name: 'stock', label: 'Tồn kho *', type: 'number' },
        { name: 'flowerType', label: 'Loại hoa (vd: Hoa hồng, Tulip...)' },
        { name: 'occasion', label: 'Dịp tặng (vd: Sinh nhật, Tình yêu...)' },
        { name: 'color', label: 'Màu sắc' },
        { name: 'bouquetSize', label: 'Kích thước bó (vd: 50 bông...)' },
        { name: 'weightKg', label: 'Khối lượng (kg)', type: 'number' },
        { name: 'meaning', label: 'Ý nghĩa loài hoa', col: 2 },
      ].map(f => (
        <div key={f.name} className={f.col === 2 ? 'col-span-2' : ''}>
          <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
          {f.name === 'meaning' ? (
            <textarea name={f.name} value={form[f.name]} onChange={handleFormChange} rows={2} className="input text-sm resize-none" />
          ) : (
            <input name={f.name} type={f.type ?? 'text'} value={form[f.name]} onChange={handleFormChange} className="input text-sm" />
          )}
        </div>
      ))}

              {/* Category select */}
   <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">Danh mục *</label>
     <select name="categoryId" value={form.categoryId} onChange={handleFormChange} className="input text-sm">
  <option value="">-- Chọn danh mục --</option>
     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
   </select>
       </div>

              {/* isOnSale */}
    <div className="flex items-center gap-2 mt-2">
    <input type="checkbox" name="isOnSale" checked={form.isOnSale} onChange={handleFormChange} className="accent-amber-500 w-4 h-4" id="isOnSale" />
       <label htmlFor="isOnSale" className="text-sm text-gray-700">Đang sale</label>
          </div>

      {/* MainImageUrl */}
              <div className="col-span-2">
    <label className="block text-xs font-medium text-gray-600 mb-1">URL ảnh chính</label>
          <input name="mainImageUrl" value={form.mainImageUrl} onChange={handleFormChange} className="input text-sm" />
  </div>

            {/* Description */}
              <div className="col-span-2">
         <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} className="input text-sm resize-none" />
       </div>
       </div>

      <div className="flex gap-3 pt-2">
    <button onClick={() => setModal(null)} className="flex-1 btn-outline">Hủy</button>
  <button onClick={handleSave} disabled={loading} className="flex-1 btn-primary">
     {loading ? 'Đang lưu...' : 'Lưu'}
 </button>
          </div>
   </div>
      </div>
      )}
    </div>
  );
}
