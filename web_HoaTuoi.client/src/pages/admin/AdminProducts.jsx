// src/pages/admin/AdminProducts.jsx
import { useState, useEffect } from 'react';
import { 
  Plus, Pencil, Eye, EyeOff, Search, PackagePlus, 
  ClipboardList, Package, X, ChevronLeft, ChevronRight,
  Upload, Link as LinkIcon, Image as ImageIcon, Lock
} from 'lucide-react';
import apiClient from '../../api/client';
import { formatVnd } from '../../utils/format';
import { resolveImage } from '../../utils/imageResolver';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const EMPTY_FORM = {
  name: '', slug: '', description: '', price: '', salePrice: '', isOnSale: false,
  categoryId: '', flowerType: '', occasion: '', color: '',
  bouquetSize: '', meaning: '', weightKg: '', stock: 0,
  mainImageUrl: '',
};

const EMPTY_IMPORT = {
  productId: '', quantity: '', importPrice: '', supplierName: '', notes: ''
};

function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-');
}

export default function AdminProducts() {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'imports'
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'hidden' | 'out_of_stock'

  // ── Sản phẩm state ────────────────────────────────────
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // dùng cho dropdown nhập kho
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc | date_asc | price_asc | price_desc | sold_desc | stock_asc | stock_desc | name_asc
  const [modal, setModal] = useState(null); // null | 'edit'
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ảnh chính upload state
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url'
  const [uploadingMain, setUploadingMain] = useState(false);

  // Ảnh phụ state
  const [subImages, setSubImages] = useState([]);
  const [pendingSubImages, setPendingSubImages] = useState([]); // ảnh phụ chờ khi tạo mới
  const [uploadingSub, setUploadingSub] = useState(false);

  // ── Nhập kho state ────────────────────────────────────
  const [imports, setImports] = useState([]);
  const [importTotal, setImportTotal] = useState(0);
  const [importPage, setImportPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState(EMPTY_IMPORT);
  const [importLoading, setImportLoading] = useState(false);

  // ── ConfirmModal state ────────────────────────────────
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    description: '',
    confirmText: 'Xác nhận',
    confirmVariant: 'danger',
    onConfirm: () => {},
  });

  const PAGE_SIZE = 10;

  // ── Fetch sản phẩm ────────────────────────────────────
  const fetchProducts = () => {
    apiClient.get(`/products/admin-list?page=${page}&pageSize=${PAGE_SIZE}&statusFilter=${statusFilter}&sortBy=${sortBy}${search ? `&q=${search}` : ''}`)
      .then(r => { 
        setProducts(r.data.items ?? []); 
        setTotal(r.data.total ?? 0); 
      })
      .catch(() => {});
  };

  // ── Fetch lịch sử nhập kho ────────────────────────────
  const fetchImports = () => {
    apiClient.get(`/inventory-imports?page=${importPage}&pageSize=${PAGE_SIZE}`)
      .then(r => { setImports(r.data.items ?? []); setImportTotal(r.data.total ?? 0); })
      .catch(() => toast.error('Không thể tải lịch sử nhập kho'));
  };

  // Fetch sub-images when editing
  const fetchSubImages = (prodId) => {
    apiClient.get(`/products/${prodId}/images`)
      .then(r => setSubImages(r.data ?? []))
      .catch(() => {});
  };

  useEffect(() => { fetchProducts(); }, [page, search, statusFilter, sortBy]);
  useEffect(() => { if (activeTab === 'imports') fetchImports(); }, [activeTab, importPage]);
  
  useEffect(() => {
    apiClient.get('/categories').then(r => setCategories(r.data ?? [])).catch(() => {});
    // Load all products for select dropdown
    apiClient.get('/products?page=1&pageSize=200')
      .then(r => setAllProducts(r.data.items ?? []))
      .catch(() => {});
  }, [modal, showImportModal]);

  // ── Sản phẩm handlers ─────────────────────────────────
  function openCreate() { 
    setForm(EMPTY_FORM); 
    setEditId(null); 
    setSubImages([]);
    setPendingSubImages([]);
    setModal('edit'); 
  }
  
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
    fetchSubImages(p.id);
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

  // Upload ảnh chính
  async function handleMainImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploadingMain(true);
    try {
      const res = await apiClient.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setForm(f => ({ ...f, mainImageUrl: res.data.url }));
      toast.success('Tải ảnh chính lên thành công!');
    } catch {
      toast.error('Lỗi khi tải ảnh lên');
    } finally {
      setUploadingMain(false);
    }
  }

  // Upload/Thêm nhiều ảnh phụ cùng lúc
  async function handleSubImageUpload(e) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const currentCount = subImages.length + pendingSubImages.length;
    if (currentCount >= 5) {
      return toast.error('Đã đạt giới hạn tối đa 5 ảnh phụ.');
    }

    // Chỉ lấy đủ số lượng ảnh phụ còn thiếu
    const allowedFiles = files.slice(0, 5 - currentCount);
    if (files.length > allowedFiles.length) {
      toast.error(`Chỉ có thể chọn thêm tối đa ${allowedFiles.length} ảnh phụ.`);
    }

    setUploadingSub(true);
    try {
      const uploadPromises = allowedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await apiClient.post('/products/upload-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.url;
      });

      const urls = await Promise.all(uploadPromises);

      if (editId) {
        // Khi sửa sản phẩm: lưu thẳng lên backend từng ảnh
        const savePromises = urls.map(async (url, idx) => {
          const addRes = await apiClient.post(`/products/${editId}/images`, {
            imageUrl: url,
            displayOrder: subImages.length + idx + 1
          });
          return addRes.data;
        });
        const savedImages = await Promise.all(savePromises);
        setSubImages(prev => [...prev, ...savedImages]);
        toast.success(`Đã thêm thành công ${urls.length} ảnh phụ!`);
      } else {
        // Khi tạo mới: lưu tạm vào pendingSubImages
        const newPending = urls.map((url, idx) => ({
          tempId: Date.now() + idx,
          imageUrl: url
        }));
        setPendingSubImages(prev => [...prev, ...newPending]);
        toast.success(`Đã thêm ${urls.length} ảnh phụ vào hàng chờ!`);
      }
    } catch {
      toast.error('Lỗi khi thêm ảnh phụ');
    } finally {
      setUploadingSub(false);
      e.target.value = '';
    }
  }

  // Xóa ảnh phụ
  function triggerDeleteSubImage(imgId) {
    setConfirmModal({
      open: true,
      title: 'Xác nhận xóa ảnh phụ',
      description: 'Bạn có chắc chắn muốn xóa ảnh phụ này khỏi sản phẩm?',
      confirmText: 'Xác nhận xóa',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/products/${editId}/images/${imgId}`);
          setSubImages(prev => prev.filter(img => img.id !== imgId));
          toast.success('Đã xóa ảnh phụ');
        } catch {
          toast.error('Không thể xóa ảnh phụ');
        }
      }
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
      if (editId) {
        await apiClient.put(`/products/${editId}`, payload);
        toast.success('Cập nhật thành công!');
      } else {
        const res = await apiClient.post('/products', payload);
        const newId = res.data?.id ?? res.data?.productId ?? res.data;
        // Gán ảnh phụ đang chờ vào sản phẩm mới
        if (newId && pendingSubImages.length > 0) {
          await Promise.all(pendingSubImages.map((img, idx) =>
            apiClient.post(`/products/${newId}/images`, { imageUrl: img.imageUrl, displayOrder: idx + 1 })
          ));
        }
        toast.success('Tạo sản phẩm thành công!');
      }
      setModal(null);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  function triggerDeactivate(id, name) {
    setConfirmModal({
      open: true,
      title: 'Xác nhận ẩn sản phẩm',
      description: `Bạn có chắc chắn muốn tạm ngừng kinh doanh và ẩn sản phẩm "${name}" khỏi trang bán hàng? Khách hàng sẽ thấy sản phẩm ở trạng thái Ngừng kinh doanh.`,
      confirmText: 'Xác nhận ẩn',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/products/${id}`);
          toast.success('Đã ẩn sản phẩm');
          fetchProducts();
        } catch { toast.error('Không thể thực hiện'); }
      }
    });
  }

  function triggerRestore(id, name) {
    setConfirmModal({
      open: true,
      title: 'Kích hoạt lại sản phẩm',
      description: `Bạn có chắc chắn muốn kích hoạt bán lại sản phẩm "${name}"? Sản phẩm sẽ xuất hiện bình thường trên website.`,
      confirmText: 'Kích hoạt',
      confirmVariant: 'success',
      onConfirm: async () => {
        try {
          await apiClient.post(`/products/${id}/restore`);
          toast.success('Đã kích hoạt bán lại!');
          fetchProducts();
        } catch { toast.error('Không thể kích hoạt lại'); }
      }
    });
  }

  // ── Nhập kho handlers ─────────────────────────────────
  function openImportModal(productId = '') {
    setImportForm({ ...EMPTY_IMPORT, productId: productId ? String(productId) : '' });
    setShowImportModal(true);
  }

  async function handleImportSave() {
    if (!importForm.productId) return toast.error('Vui lòng chọn sản phẩm');
    if (!importForm.quantity || Number(importForm.quantity) <= 0) return toast.error('Số lượng phải > 0');
    if (importForm.importPrice === '' || Number(importForm.importPrice) < 0) return toast.error('Đơn giá không hợp lệ');
    setImportLoading(true);
    try {
      const res = await apiClient.post('/inventory-imports', {
        productId: Number(importForm.productId),
        quantity: Number(importForm.quantity),
        importPrice: Number(importForm.importPrice),
        supplierName: importForm.supplierName || null,
        notes: importForm.notes || null,
      });
      toast.success(res.data?.message ?? 'Nhập kho thành công!');
      setShowImportModal(false);
      fetchProducts();
      if (activeTab === 'imports') fetchImports();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Lỗi khi nhập kho');
    } finally {
      setImportLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const importTotalPages = Math.ceil(importTotal / PAGE_SIZE);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-gray-900">Quản lý sản phẩm hoa</h1>
        <div className="flex items-center gap-2">
          {activeTab === 'products' && (
            <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm shadow-sm hover:shadow-md transition">
              <Plus size={16} /> Thêm sản phẩm
            </button>
          )}
          {activeTab === 'imports' && (
            <button onClick={() => openImportModal()} className="btn-primary flex items-center gap-2 text-sm shadow-sm hover:shadow-md transition">
              <PackagePlus size={16} /> Nhập kho mới
            </button>
          )}
        </div>
      </div>

      {/* Primary Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'products' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-750'}`}
        >
          <Package size={15} /> Sản phẩm
        </button>
        <button
          onClick={() => setActiveTab('imports')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'imports' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-750'}`}
        >
          <ClipboardList size={15} /> Lịch sử nhập kho
          {importTotal > 0 && <span className="bg-[#E92E69]/10 text-[#E92E69] text-[10px] font-black px-2 py-0.5 rounded-full">{importTotal}</span>}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: DANH SÁCH SẢN PHẨM                                   */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'products' && (
        <>
          {/* Secondary Filter Tabs & Search Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-gray-55/60 p-1 rounded-xl w-fit border border-gray-100">
              {[
                { id: 'all', label: 'Tất cả' },
                { id: 'active', label: 'Đang bán' },
                { id: 'hidden', label: 'Đã ẩn' },
                { id: 'out_of_stock', label: 'Hết hàng' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setStatusFilter(t.id); setPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${statusFilter === t.id ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:bg-white'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search & Sort */}
            <div className="flex items-center gap-2 max-w-md w-full md:w-auto">
              <div className="relative flex-grow md:w-56">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Tìm sản phẩm..." className="input pl-9 text-sm" />
              </div>
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value); setPage(1); }}
                className="input text-xs w-36 font-bold py-2.5 px-3 bg-white border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-0 cursor-pointer"
              >
                <option value="date_desc">↓ Mới nhất</option>
                <option value="date_asc">↑ Cũ nhất</option>
                <option value="price_asc">↑ Giá tăng dần</option>
                <option value="price_desc">↓ Giá giảm dần</option>
                <option value="sold_desc">↓ Bán chạy nhất</option>
                <option value="stock_asc">↑ Tồn kho ít nhất</option>
                <option value="stock_desc">↓ Tồn kho nhiều nhất</option>
                <option value="name_asc">↑ Tên A-Z</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b border-gray-100">
                    {['Sản phẩm', 'Danh mục', 'Giá bán', 'Tồn kho', 'Trạng thái', 'Thao tác'].map(h => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map(p => (
                    <tr key={p.id} className={`hover:bg-gray-50/50 transition-colors ${p.isActive === false ? 'bg-gray-50/40 opacity-75' : ''}`}>
                      {/* Tên sản phẩm */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={resolveImage(p.mainImageUrl)} alt={p.name} className="w-12 h-12 rounded-xl object-cover bg-gray-150 border border-gray-100 flex-shrink-0" />
                          <div>
                            <p className="font-bold text-gray-800 line-clamp-1">{p.name}</p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{p.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Danh mục */}
                      <td className="px-6 py-4 text-gray-500 font-medium">{p.categoryName}</td>

                      {/* Giá */}
                      <td className="px-6 py-4">
                        {p.isOnSale && p.salePrice ? (
                          <div>
                            <span className="font-black text-[#E92E69]">{formatVnd(p.salePrice)}</span>
                            <span className="text-gray-450 line-through text-xs ml-1.5">{formatVnd(p.price)}</span>
                          </div>
                        ) : <span className="font-bold text-gray-800">{formatVnd(p.price)}</span>}
                      </td>

                      {/* Tồn kho + nút nhập nhanh */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${p.stock <= 5 ? 'text-rose-500' : 'text-gray-700'}`}>{p.stock}</span>
                          <button
                            onClick={() => openImportModal(p.id)}
                            title="Nhập thêm kho"
                            className="p-1 text-gray-300 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                          >
                            <PackagePlus size={15} />
                          </button>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4">
                        {p.isActive === false ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-gray-100 text-gray-500">
                            Đã ẩn / Ngừng KD
                          </span>
                        ) : p.stock === 0 ? (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700">
                            Tạm hết hàng
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700">
                            Đang bán
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(p)} title="Chỉnh sửa chi tiết" className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all">
                            <Pencil size={15} />
                          </button>
                          {p.isActive !== false ? (
                            <button onClick={() => triggerDeactivate(p.id, p.name)} title="Tạm ẩn sản phẩm" className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                              <Eye size={15} />
                            </button>
                          ) : (
                            <button onClick={() => triggerRestore(p.id, p.name)} title="Hiển thị lại sản phẩm" className="p-2 text-gray-450 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all">
                              <EyeOff size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-16 text-gray-400 font-bold">Không tìm thấy sản phẩm nào</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 py-4 border-t border-gray-100 bg-gray-50/50">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-amber-400 bg-white">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold ${p === page ? 'bg-amber-500 text-white' : 'border border-gray-200 hover:border-amber-400 bg-white'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-amber-400 bg-white">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* TAB: LỊCH SỬ NHẬP KHO                                     */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'imports' && (
        <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  {['Sản phẩm', 'SL nhập', 'Đơn giá nhập', 'Tổng chi phí', 'Nhà cung cấp', 'Ngày nhập', 'Ghi chú'].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {imports.map(imp => (
                  <tr key={imp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {imp.productImage && (
                          <img src={resolveImage(imp.productImage)} alt={imp.productName} className="w-10 h-10 rounded-xl object-cover bg-gray-100 border flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-gray-800 line-clamp-1">{imp.productName}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Tồn hiện tại: {imp.currentStock}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-black px-2 py-1 rounded-lg text-xs ${imp.quantity >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                        {imp.quantity > 0 ? `+${imp.quantity}` : imp.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-700">{formatVnd(imp.importPrice)}</td>
                    <td className="px-6 py-4 font-black text-gray-900">{formatVnd(imp.totalCost)}</td>
                    <td className="px-6 py-4 text-gray-500 font-medium">{imp.supplierName || <span className="text-gray-300">—</span>}</td>
                    <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                      {new Date(imp.importDate).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs max-w-[160px] truncate">{imp.notes || '—'}</td>
                  </tr>
                ))}
                {imports.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-16 text-gray-400 font-bold">Chưa có lịch sử nhập kho</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination nhập kho */}
          {importTotalPages > 1 && (
            <div className="flex justify-center gap-2 py-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setImportPage(p => Math.max(1, p - 1))} disabled={importPage === 1} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-amber-400 bg-white">
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: importTotalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setImportPage(p)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold ${p === importPage ? 'bg-amber-500 text-white' : 'border border-gray-200 hover:border-amber-400 bg-white'}`}>
                  {p}
                </button>
              ))}
              <button onClick={() => setImportPage(p => Math.min(importTotalPages, p + 1))} disabled={importPage === importTotalPages} className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-40 hover:border-amber-400 bg-white">
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: Tạo / Chỉnh sửa sản phẩm                           */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {modal === 'edit' && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-black text-gray-900">{editId ? 'Chỉnh sửa chi tiết hoa' : 'Thêm sản phẩm hoa mới'}</h2>
              <button onClick={() => setModal(null)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Basic Fields */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Tên sản phẩm *</label>
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="Tên bó hoa..." className="input text-sm" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Slug URL *</label>
                <input name="slug" value={form.slug} onChange={handleFormChange} placeholder="tên-bo-hoa-seo" className="input text-sm font-mono text-gray-600" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Giá bán gốc (VNĐ) *</label>
                <input name="price" type="number" value={form.price} onChange={handleFormChange} placeholder="VD: 500000" className="input text-sm font-bold" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Giá khuyến mãi (VNĐ)</label>
                <input name="salePrice" type="number" value={form.salePrice} onChange={handleFormChange} placeholder="VD: 450000" className="input text-sm font-bold text-rose-600" />
              </div>

              {/* TỒN KHO: Mở khóa khi Edit và hiển thị lịch sử */}
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">
                  Số lượng tồn kho {editId ? '(Chỉnh sửa trực tiếp)' : 'ban đầu *'}
                </label>
                <div className="flex gap-2 items-center">
                  <input 
                    name="stock" 
                    type="number" 
                    value={form.stock} 
                    onChange={handleFormChange} 
                    placeholder="Nhập số lượng tồn..." 
                    className="input text-sm font-bold flex-1" 
                  />
                  {editId && (
                    <button 
                      type="button"
                      onClick={() => { setModal(null); openImportModal(editId); }}
                      className="px-3.5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex-shrink-0"
                    >
                      Nhập kho
                    </button>
                  )}
                </div>
                {editId && (
                  <p className="text-[10px] text-amber-600/80 font-normal mt-1 ml-1">
                    * Lưu ý: Thay đổi số lượng tại đây sẽ tự động tạo một lịch sử điều chỉnh kho trong tab "Lịch sử nhập kho".
                  </p>
                )}
              </div>

              {/* Details Fields */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Danh mục *</label>
                <select name="categoryId" value={form.categoryId} onChange={handleFormChange} className="input text-sm font-medium">
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 pt-5 pl-2">
                <input type="checkbox" name="isOnSale" checked={form.isOnSale} onChange={handleFormChange} className="accent-[#E92E69] w-4 h-4 rounded" id="isOnSale" />
                <label htmlFor="isOnSale" className="text-sm font-bold text-gray-700 select-none">Đang áp dụng Sale</label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Loại hoa chính</label>
                <input name="flowerType" value={form.flowerType} onChange={handleFormChange} placeholder="VD: Hoa hồng đỏ, Hướng dương..." className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Màu sắc chính</label>
                <input name="color" value={form.color} onChange={handleFormChange} placeholder="VD: Đỏ, Vàng, Hồng pastel..." className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Dịp phù hợp</label>
                <input name="occasion" value={form.occasion} onChange={handleFormChange} placeholder="VD: Sinh nhật, Kỷ niệm, Tình yêu..." className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Kích thước bó</label>
                <input name="bouquetSize" value={form.bouquetSize} onChange={handleFormChange} placeholder="VD: Bó to 50 bông, Giỏ hoa để bàn..." className="input text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Cân nặng (kg)</label>
                <input name="weightKg" type="number" step="0.1" value={form.weightKg} onChange={handleFormChange} placeholder="VD: 1.5" className="input text-sm" />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Ý nghĩa truyền tải</label>
                <textarea name="meaning" value={form.meaning} onChange={handleFormChange} rows={2} placeholder="Ý nghĩa sâu sắc của bó hoa này..." className="input text-sm resize-none" />
              </div>

              {/* ── ẢNH CHÍNH: Cho upload file hoặc nhập URL ── */}
              <div className="col-span-2 border-t pt-3 mt-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Ảnh chính của sản phẩm *</label>
                <div className="flex gap-2 mb-3 bg-gray-50 p-1 rounded-xl w-fit border">
                  <button 
                    type="button" 
                    onClick={() => setImageTab('upload')} 
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${imageTab === 'upload' ? 'bg-white text-gray-900 shadow-sm border' : 'text-gray-500'}`}
                  >
                    <Upload size={13} /> Tải file lên
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setImageTab('url')} 
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg transition-all ${imageTab === 'url' ? 'bg-white text-gray-900 shadow-sm border' : 'text-gray-500'}`}
                  >
                    <LinkIcon size={13} /> Nhập liên kết URL
                  </button>
                </div>

                {imageTab === 'upload' ? (
                  <div className="border-2 border-dashed border-gray-200 hover:border-pink-300 rounded-2xl p-4 transition-all text-center flex flex-col items-center justify-center min-h-[100px] bg-gray-50/30">
                    {form.mainImageUrl ? (
                      <div className="relative group w-20 h-20 rounded-xl overflow-hidden shadow">
                        <img src={resolveImage(form.mainImageUrl)} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setForm(f => ({ ...f, mainImageUrl: '' }))}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          Thay đổi
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-1">
                        <Upload size={24} className="text-gray-400 animate-bounce" />
                        <span className="text-xs font-bold text-gray-650">Nhấp để tải file ảnh lên</span>
                        <span className="text-[10px] text-gray-450 font-medium">Hỗ trợ JPG, PNG, WEBP</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleMainImageUpload} disabled={uploadingMain} />
                      </label>
                    )}
                    {uploadingMain && <p className="text-[10px] text-pink-500 font-bold mt-2 animate-pulse">Đang tải ảnh lên...</p>}
                  </div>
                ) : (
                  <input name="mainImageUrl" value={form.mainImageUrl} onChange={handleFormChange} placeholder="Nhập đường dẫn ảnh từ internet (https://...)" className="input text-sm" />
                )}
              </div>

              {/* ── ẢNH PHỤ ── */}
              <div className="col-span-2 border-t pt-3 mt-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Thư viện ảnh phụ</label>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2.5">
                    {/* Ảnh phụ đã lưu (khi edit) */}
                    {subImages.map(img => (
                      <div key={img.id} className="relative group w-16 h-16 rounded-xl overflow-hidden shadow border bg-gray-50 flex-shrink-0">
                        <img src={resolveImage(img.imageUrl)} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => triggerDeleteSubImage(img.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {/* Ảnh phụ tạm (khi tạo mới) */}
                    {pendingSubImages.map((img, idx) => (
                      <div key={img.tempId} className="relative group w-16 h-16 rounded-xl overflow-hidden shadow border border-dashed border-amber-300 bg-amber-50 flex-shrink-0">
                        <img src={resolveImage(img.imageUrl)} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-amber-400/80 text-[7px] text-white font-bold text-center py-0.5">Chờ lưu</div>
                        <button
                          type="button"
                          onClick={() => setPendingSubImages(prev => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                    {/* Nút thêm ảnh */}
                    {(subImages.length + pendingSubImages.length) < 5 && (
                      <label className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 hover:border-pink-300 bg-gray-50/20 hover:bg-pink-50/10 flex flex-col items-center justify-center cursor-pointer transition-all">
                        <Plus size={18} className="text-gray-400" />
                        <span className="text-[8px] font-bold text-gray-400 mt-0.5">Thêm ảnh</span>
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleSubImageUpload} disabled={uploadingSub} />
                      </label>
                    )}
                  </div>
                  {uploadingSub && <p className="text-[10px] text-pink-500 font-bold animate-pulse">Đang tải ảnh phụ...</p>}
                  {!editId && pendingSubImages.length > 0 && (
                    <p className="text-[10px] text-amber-600 font-medium">💡 {pendingSubImages.length} ảnh sẽ được gắn vào sản phẩm sau khi nhấn Lưu.</p>
                  )}
                  <p className="text-[10px] text-gray-400 font-medium">Hỗ trợ hiển thị tối đa 5 ảnh phụ kiểu slide/shopee ở trang chi tiết sản phẩm.</p>
                </div>
              </div>

              {/* Description */}
              <div className="col-span-2 border-t pt-3 mt-1">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">Mô tả sản phẩm</label>
                <textarea name="description" value={form.description} onChange={handleFormChange} rows={3} placeholder="Mô tả chi tiết và sinh động về sản phẩm..." className="input text-sm resize-none" />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-650 font-bold hover:bg-gray-50 transition-all select-none">Hủy bỏ</button>
              <button onClick={handleSave} disabled={loading || uploadingMain} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 select-none">
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* MODAL: Nhập kho                                            */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setShowImportModal(false); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center">
                  <PackagePlus size={18} className="text-amber-600" />
                </div>
                <h2 className="text-lg font-black text-gray-900">Tạo phiếu nhập kho</h2>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Chọn sản phẩm */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Sản phẩm hoa *</label>
                <select
                  value={importForm.productId}
                  onChange={e => setImportForm(f => ({ ...f, productId: e.target.value }))}
                  className="input text-sm font-medium"
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {allProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Tồn hiện tại: {p.stock})</option>
                  ))}
                </select>
              </div>

              {/* Số lượng + Đơn giá */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Số lượng nhập *</label>
                  <input
                    type="number" min="1"
                    value={importForm.quantity}
                    onChange={e => setImportForm(f => ({ ...f, quantity: e.target.value }))}
                    className="input text-sm font-bold"
                    placeholder="VD: 50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Đơn giá nhập (VNĐ)</label>
                  <input
                    type="number" min="0"
                    value={importForm.importPrice}
                    onChange={e => setImportForm(f => ({ ...f, importPrice: e.target.value }))}
                    className="input text-sm font-bold"
                    placeholder="VD: 15000"
                  />
                </div>
              </div>

              {/* Preview tổng tiền */}
              {importForm.quantity && importForm.importPrice && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between shadow-inner">
                  <span className="text-xs text-amber-800 font-semibold">Tổng chi phí nhập:</span>
                  <span className="text-base font-black text-amber-700">
                    {formatVnd(Number(importForm.quantity) * Number(importForm.importPrice))}
                  </span>
                </div>
              )}

              {/* Nhà cung cấp */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Nhà cung cấp / Nhà vườn</label>
                <input
                  type="text"
                  value={importForm.supplierName}
                  onChange={e => setImportForm(f => ({ ...f, supplierName: e.target.value }))}
                  className="input text-sm"
                  placeholder="VD: Nhà vườn hoa Đà Lạt, Chợ đầu mối Đầm Sen..."
                />
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5 ml-1">Ghi chú nhập kho</label>
                <textarea
                  value={importForm.notes}
                  onChange={e => setImportForm(f => ({ ...f, notes: e.target.value }))}
                  className="input text-sm resize-none"
                  rows={2}
                  placeholder="Ghi chú thêm về lô hàng này..."
                />
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t">
              <button onClick={() => setShowImportModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-655 font-bold hover:bg-gray-50 transition-all select-none">Hủy bỏ</button>
              <button onClick={handleImportSave} disabled={importLoading} className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 select-none flex items-center justify-center gap-2">
                <PackagePlus size={15} />
                {importLoading ? 'Đang lưu...' : 'Xác nhận nhập kho'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reusable ConfirmModal for hiding/showing products */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal(prev => ({ ...prev, open: false }))}
      />
    </div>
  );
}
