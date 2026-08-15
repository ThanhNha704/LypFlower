import { useState, useEffect } from 'react';
import { Search, ListOrdered, CalendarDays, Plus, X } from 'lucide-react';
import apiClient from '../../api/client';
import { formatVnd } from '../../utils/format';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const PAGE_SIZE = 15;

  const fetchUsers = () => {
    apiClient.get(`/users?page=${page}&pageSize=${PAGE_SIZE}${search ? `&search=${search}` : ''}`)
      .then(r => { 
        setUsers(r.data.items ?? []); 
        setTotal(r.data.total ?? 0); 
      })
      .catch(() => toast.error('Không thể tải danh sách khách hàng'));
  };

  useEffect(() => { 
    fetchUsers(); 
  }, [page]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      fetchUsers();
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/users/staff', staffForm);
      toast.success('Tạo tài khoản nhân viên thành công');
      setIsModalOpen(false);
      setStaffForm({ fullName: '', email: '', phone: '', password: '' });
      fetchUsers(); // Refresh danh sách
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Khách hàng & Nhân viên</h1>
          <p className="text-sm text-gray-400">{total} tài khoản</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
        >
          <Plus size={18} /> Tạo TK Nhân viên
        </button>
      </div>

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input 
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={handleSearch}
          placeholder="Tìm kiếm theo Tên, Email, SĐT (Nhấn Enter)..." 
          className="input pl-9 text-sm focus:ring-amber-500/20" 
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Khách hàng</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Thông tin liên hệ</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Lịch sử Mua hàng</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Ngày đăng ký</th>
                <th className="px-5 py-4 text-left font-semibold text-gray-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg border border-amber-100">
                        {u.fullName?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{u.fullName || 'Khách vãng lai'}</p>
                        <p className="text-xs text-gray-400 font-mono">{u.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-600">{u.email}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{u.phoneNumber || 'Không có SĐT'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1 text-sm">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <ListOrdered size={14} className="text-blue-400" />
                        <span><b className="text-gray-800">{u.totalOrders}</b> đơn hàng</span>
                      </div>
                      <div className="text-amber-600 font-medium">
                        Tổng: {formatVnd(u.totalSpent)}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-gray-400" />
                      {new Date(u.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-bold px-2 py-1.5 rounded-lg ${u.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                      {u.isActive ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-gray-400">
                    Chưa có khách hàng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-4 border-t border-gray-100">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${p === page ? 'bg-amber-500 text-white' : 'border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-600'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal Tạo Nhân Viên */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-bold text-lg text-gray-900">Tạo tài khoản Nhân viên</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateStaff} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên *</label>
                <input required type="text" className="input" placeholder="Nguyễn Văn A"
                  value={staffForm.fullName} onChange={e => setStaffForm({...staffForm, fullName: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email * (Dùng để đăng nhập)</label>
                <input required type="email" className="input" placeholder="nhanvien@hoatuoi.vn"
                  value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu *</label>
                <input required type="password" className="input" placeholder="Mật khẩu ít nhất 6 ký tự"
                  value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input type="tel" className="input" placeholder="09xxxx"
                  value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost px-4 py-2 text-gray-500 hover:text-gray-700">Hủy</button>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
