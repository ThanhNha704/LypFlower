import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Truck, Search } from 'lucide-react';
import apiClient from '../../api/client';
import { formatVnd } from '../../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  name: '',
  fee: '',
  estimatedTime: '',
  isActive: true
};

export default function AdminShipping() {
  const [zones, setZones] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchZones = () => {
    apiClient.get('/shipping/all')
      .then(r => setZones(r.data ?? []))
      .catch(() => toast.error('Không thể tải cấu hình vận chuyển'));
  };

  useEffect(() => { fetchZones(); }, []);

  const filteredZones = zones.filter(z => 
    z.name.toLowerCase().includes(search.toLowerCase())
  );

  function openCreate() { 
    setForm(EMPTY_FORM); 
    setEditId(null); 
    setModal('edit'); 
  }

  function openEdit(z) {
    setForm({
      name: z.name,
      fee: z.fee,
      estimatedTime: z.estimatedTime ?? '',
      isActive: z.isActive
    });
    setEditId(z.id);
    setModal('edit');
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave() {
    if (!form.name || form.fee === '') {
      return toast.error('Vui lòng điền Tên khu vực và Phí vận chuyển');
    }

    setLoading(true);
    try {
      const payload = {
        id: editId ?? 0,
        ...form,
        fee: Number(form.fee)
      };

      if (editId) {
        await apiClient.put(`/shipping/${editId}`, payload);
        toast.success('Cập nhật thành công!');
      } else {
        await apiClient.post('/shipping', payload);
        toast.success('Thêm khu vực vận chuyển thành công!');
      }
      setModal(null);
      fetchZones();
    } catch (err) {
      toast.error('Có lỗi xảy ra khi lưu');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Bạn có chắc muốn xóa khu vực vận chuyển "${name}"?`)) return;
    try {
      await apiClient.delete(`/shipping/${id}`);
      toast.success('Đã xóa khu vực vận chuyển');
      fetchZones();
    } catch { toast.error('Không thể xóa. Khu vực này có thể đang liên kết với đơn hàng.'); }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Cấu hình Vận Chuyển</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm shadow-sm transition-transform hover:scale-[1.02]">
          <Plus size={16} /> Thêm khu vực
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm khu vực (VD: Nội thành HCM)..." 
          className="input pl-9 text-sm focus:ring-amber-500/20" 
        />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredZones.map(z => (
          <div key={z.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${z.isActive ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{z.name}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${z.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {z.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-center py-2 border-b border-gray-50">
                <span className="text-sm text-gray-500">Phí giao hàng</span>
                <span className="font-bold text-lg text-amber-600">
                  {z.fee === 0 ? 'Miễn phí' : formatVnd(z.fee)}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500">TG Giao dự kiến</span>
                <span className="font-medium text-gray-800">{z.estimatedTime || 'Trực tiếp'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
              <button onClick={() => openEdit(z)} className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-amber-50 hover:text-amber-600 transition-colors flex justify-center items-center gap-2">
                <Pencil size={14} /> Sửa
              </button>
              <button onClick={() => handleDelete(z.id, z.name)} className="px-3 py-2 rounded-xl text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors flex justify-center items-center">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filteredZones.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center">
            <Truck size={40} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-400 font-medium">Không tìm thấy hoặc chưa có khu vực vận chuyển nào</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {modal === 'edit' && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{editId ? 'Sửa Khu Vực' : 'Thêm Khu Vực Mới'}</h2>
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                <Truck size={20} />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Tên khu vực / Phương thức <span className="text-red-500">*</span></label>
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="VD: Giao hỏa tốc HCM, Giao tiêu chuẩn..." className="input text-sm focus:bg-white" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Phí vận chuyển (VNĐ) <span className="text-red-500">*</span></label>
                <input name="fee" type="number" min="0" value={form.fee} onChange={handleFormChange} placeholder="VD: 30000 (nhập 0 nếu Freeship)" className="input text-sm font-bold text-amber-600 focus:bg-white" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Thời gian giao dự kiến</label>
                <input name="estimatedTime" value={form.estimatedTime} onChange={handleFormChange} placeholder="VD: 1-2 ngày, 2H..." className="input text-sm focus:bg-white" />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="relative">
                    <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleFormChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Trạng thái Hoạt động</span>
                    <span className="text-xs text-gray-500">Áp dụng cho khách hàng khi thanh toán</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setModal(null)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                Hủy bỏ
              </button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-3 px-4 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Đang lưu...' : 'Lưu Khu Vực'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
