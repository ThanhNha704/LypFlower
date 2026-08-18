import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Ticket, Search, Calendar, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../../api/client';
import { formatVnd } from '../../utils/format';
import toast from 'react-hot-toast';

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'Percentage',
  discountValue: '',
  minOrderValue: '',
  maxDiscountAmount: '',
  usageLimit: '',
  isActive: true,
  validFrom: '',
  validUntil: ''
};

export default function AdminVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchVouchers = () => {
    apiClient.get('/vouchers')
      .then(r => setVouchers(r.data ?? []))
      .catch(() => toast.error('Không thể tải mã giảm giá'));
  };

  useEffect(() => { fetchVouchers(); }, []);

  const filteredVouchers = vouchers.filter(v => 
    v.code.toLowerCase().includes(search.toLowerCase()) || 
    (v.description && v.description.toLowerCase().includes(search.toLowerCase()))
  );

  function openCreate() { 
    setForm({
      ...EMPTY_FORM,
      validFrom: new Date().toISOString().slice(0, 16),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
    }); 
    setEditId(null); 
    setModal('edit'); 
  }

  function openEdit(v) {
    setForm({
      code: v.code,
      description: v.description ?? '',
      discountType: v.discountType,
      discountValue: v.discountValue,
      minOrderValue: v.minOrderValue ?? '',
      maxDiscountAmount: v.maxDiscountAmount ?? '',
      usageLimit: v.usageLimit ?? '',
      isActive: v.isActive,
      validFrom: v.validFrom ? new Date(v.validFrom).toISOString().slice(0, 16) : '',
      validUntil: v.validUntil ? new Date(v.validUntil).toISOString().slice(0, 16) : ''
    });
    setEditId(v.id);
    setModal('edit');
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSave() {
    const dv = Number(form.discountValue);
    if (!form.code.trim() || isNaN(dv) || dv <= 0 || !form.validFrom || !form.validUntil) {
      return toast.error('Vui lòng điền đầy đủ Mã, Giá trị giảm (> 0) và Thời gian áp dụng');
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : null,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil).toISOString()
      };

      if (editId) {
        await apiClient.put(`/vouchers/${editId}`, payload);
        toast.success('Cập nhật thành công!');
      } else {
        await apiClient.post('/vouchers', payload);
        toast.success('Tạo mã giảm giá thành công!');
      }
      setModal(null);
      fetchVouchers();
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, code) {
    if (!confirm(`Bạn có chắc muốn xóa mã giảm giá "${code}"? Hành động này không thể hoàn tác.`)) return;
    try {
      await apiClient.delete(`/vouchers/${id}`);
      toast.success('Đã xóa mã giảm giá');
      fetchVouchers();
    } catch { toast.error('Không thể xóa. Có thể mã này đang được sử dụng trong đơn hàng.'); }
  }

  const getStatusDisplay = (v) => {
    const now = new Date();
    const from = new Date(v.validFrom);
    const until = new Date(v.validUntil);
    const isUsedUp = v.usageLimit !== null && v.usedCount >= v.usageLimit;

    if (!v.isActive) return { text: 'Đã khóa', cls: 'bg-gray-100 text-gray-600', icon: XCircle };
    if (isUsedUp) return { text: 'Đã hết lượt', cls: 'bg-red-50 text-red-600', icon: XCircle };
    if (now < from) return { text: 'Sắp diễn ra', cls: 'bg-blue-50 text-blue-600', icon: Calendar };
    if (now > until) return { text: 'Đã hết hạn', cls: 'bg-gray-100 text-gray-500', icon: Calendar };
    return { text: 'Đang áp dụng', cls: 'bg-green-50 text-green-600', icon: CheckCircle };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Quản lý Mã Giảm Giá</h1>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm shadow-sm hover:shadow-md transition">
          <Plus size={16} /> Tạo mã mới
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã hoặc mô tả..." 
          className="input pl-9 text-sm focus:ring-amber-500/20 uppercase-placeholder" 
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Mã giảm giá</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Loại giảm</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Điều kiện</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Hạn sử dụng</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Lượt dùng</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Trạng thái</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600 w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredVouchers.map(v => {
                const status = getStatusDisplay(v);
                const StatusIcon = status.icon;

                return (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                          <Ticket size={20} className="rotate-45" />
                        </div>
                        <div>
                          <p className="font-mono font-bold text-gray-900 tracking-wider text-base">{v.code}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[200px]">{v.description || 'Không có mô tả'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {v.discountType === 'Percentage' ? (
                        <div className="font-bold text-amber-600 text-lg">
                          {-v.discountValue}%
                        </div>
                      ) : (
                        <div className="font-bold text-green-600 text-lg">
                          -{formatVnd(v.discountValue)}
                        </div>
                      )}
                      {v.maxDiscountAmount && v.discountType === 'Percentage' && (
                        <p className="text-xs text-gray-500">Giảm tối đa {formatVnd(v.maxDiscountAmount)}</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-600 text-xs">
                      {v.minOrderValue ? `Đơn từ ${formatVnd(v.minOrderValue)}` : 'Mọi đơn hàng'}
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs font-mono">
                      <div>{new Date(v.validFrom).toLocaleString('vi-VN')}</div>
                      <div className="text-gray-300">đến</div>
                      <div className="font-medium text-gray-700">{new Date(v.validUntil).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-medium">
                        <span className="text-amber-600">{v.usedCount}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-700">{v.usageLimit || '∞'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1.5 rounded-lg border ${status.cls} bg-opacity-50`}>
                        <StatusIcon size={14} />
                        {status.text}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(v)} className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDelete(v.id, v.code)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredVouchers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    <div className="flex flex-col items-center">
                      <Ticket size={32} className="text-gray-200 mb-3" />
                      <p>Không tìm thấy mã giảm giá nào</p>
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
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">{editId ? 'Sửa Mã Giảm Giá' : 'Tạo Mã Mới'}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Mã Code <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Ticket size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input name="code" value={form.code} onChange={handleFormChange} placeholder="VD: TET2024, FREESHIP..." className="input pl-10 text-sm font-mono font-bold uppercase tracking-wider bg-gray-50/50 focus:bg-white" />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Mô tả chương trình</label>
                <input name="description" value={form.description} onChange={handleFormChange} placeholder="VD: Giảm 20% nhân dịp Tết Nguyên Đán cho mọi đơn hàng" className="input text-sm bg-gray-50/50 focus:bg-white" />
              </div>

              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 space-y-4">
                <h3 className="font-bold text-amber-800 text-sm mb-2">Giá trị ưu đãi</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Loại giảm giá</label>
                  <select name="discountType" value={form.discountType} onChange={handleFormChange} className="input text-sm bg-white">
                    <option value="Percentage">Theo phần trăm (%)</option>
                    <option value="FixedAmount">Theo số tiền cố định (VNĐ)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">
                    Giá trị giảm <span className="text-red-500">*</span> 
                    {form.discountType === 'Percentage' ? ' (%)' : ' (VNĐ)'}
                  </label>
                  <input name="discountValue" type="number" min="0" value={form.discountValue} onChange={handleFormChange} placeholder={form.discountType === 'Percentage' ? "20" : "50000"} className="input text-sm bg-white font-bold text-amber-600" />
                </div>
                {form.discountType === 'Percentage' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Giảm tối đa (VNĐ)</label>
                    <input name="maxDiscountAmount" type="number" min="0" value={form.maxDiscountAmount} onChange={handleFormChange} placeholder="Bỏ trống nếu không giới hạn" className="input text-sm bg-white" />
                  </div>
                )}
              </div>

              <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50 space-y-4">
                <h3 className="font-bold text-blue-800 text-sm mb-2">Điều kiện áp dụng</h3>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Đơn hàng tối thiểu (VNĐ)</label>
                  <input name="minOrderValue" type="number" min="0" value={form.minOrderValue} onChange={handleFormChange} placeholder="0 cho mọi đơn hàng" className="input text-sm bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 ml-1">Tổng lượt sử dụng tối đa</label>
                  <input name="usageLimit" type="number" min="1" value={form.usageLimit} onChange={handleFormChange} placeholder="Bỏ trống nếu không giới hạn số lượng" className="input text-sm bg-white" />
                </div>
              </div>

              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Bắt đầu từ <span className="text-red-500">*</span></label>
                  <input name="validFrom" type="datetime-local" value={form.validFrom} onChange={handleFormChange} className="input text-sm text-gray-700" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1">Kết thúc vào <span className="text-red-500">*</span></label>
                  <input name="validUntil" type="datetime-local" value={form.validUntil} onChange={handleFormChange} className="input text-sm text-gray-700" />
                </div>
              </div>

              <div className="md:col-span-2 pt-2 border-t border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl hover:bg-gray-50 transition-colors w-fit">
                  <div className="relative">
                    <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleFormChange} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-gray-900 block">Kích hoạt mã</span>
                    <span className="text-xs text-gray-500">Mã có thể được sử dụng bởi khách hàng</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setModal(null)} className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                Hủy bỏ
              </button>
              <button onClick={handleSave} disabled={loading} className="flex-1 py-3 px-4 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50">
                {loading ? 'Đang lưu...' : (editId ? 'Cập nhật mã' : 'Xuất bản mã')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
