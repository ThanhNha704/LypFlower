import { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Package } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { formatVnd } from '../../utils/format';

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = () => {
    setLoading(true);
    apiClient.get('/orders/staff')
      .then(r => setOrders(r.data.items ?? []))
      .catch(() => toast.error('Lỗi tải danh sách đơn hàng'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, currentStatus) => {
    let newStatus = '';
    if (currentStatus === 'Processing') newStatus = 'Shipping';
    else if (currentStatus === 'Shipping') newStatus = 'Completed';
    else return;

    try {
      await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success('Cập nhật trạng thái thành công!');
      fetchOrders();
    } catch {
      toast.error('Lỗi khi cập nhật trạng thái');
    }
  };

  const openMap = (lat, lng) => {
    if (!lat || !lng) {
      toast.error('Đơn hàng này không có tọa độ bản đồ.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải...</div>;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto min-h-screen bg-gray-50 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Package className="text-amber-500" /> Đơn hàng của tôi
      </h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
          Bạn chưa có đơn hàng nào cần giao.
        </div>
      ) : (
        <div className="grid gap-4">
          {orders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Mã đơn: #{o.orderCode}</h3>
                  <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                  o.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                  o.status === 'Shipping' ? 'bg-purple-100 text-purple-700' :
                  o.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {o.status === 'Processing' ? 'Chờ lấy hàng' : 
                   o.status === 'Shipping' ? 'Đang giao' : 
                   o.status === 'Completed' ? 'Đã giao' : o.status}
                </span>
              </div>

              <div className="bg-amber-50/50 rounded-xl p-3 text-sm space-y-2 border border-amber-100/50">
                <p><span className="text-gray-500">Khách hàng:</span> <strong className="text-gray-800">{o.receiverName}</strong></p>
                <div className="flex items-center justify-between">
                    <p><span className="text-gray-500">SĐT:</span> <strong className="text-gray-800">{o.receiverPhone}</strong></p>
                    <a href={`tel:${o.receiverPhone}`} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md font-medium hover:bg-green-200 transition-colors">
                        Gọi điện
                    </a>
                </div>
                <p><span className="text-gray-500">Địa chỉ:</span> <span className="text-gray-800">{o.receiverAddress}</span></p>
                <p><span className="text-gray-500">Thu tiền:</span> <strong className="text-amber-600">{formatVnd(o.finalAmount)} {o.isPaid ? '(Đã thanh toán)' : '(Thu tiền mặt)'}</strong></p>
              </div>

              {o.status !== 'Completed' && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button 
                    onClick={() => openMap(o.latitude, o.longitude)}
                    className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium rounded-xl flex items-center justify-center gap-2 text-sm transition-colors border border-blue-100"
                  >
                    <MapPin size={18} /> Mở bản đồ
                  </button>
                  
                  {o.status === 'Processing' && (
                    <button 
                      onClick={() => {
                          if(window.confirm('Xác nhận nhận đơn hàng này và bắt đầu đi giao?')) {
                              handleUpdateStatus(o.id, o.status);
                          }
                      }}
                      className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      Bắt đầu đi giao
                    </button>
                  )}
                  {o.status === 'Shipping' && (
                    <button 
                      onClick={() => {
                          if(window.confirm('Xác nhận đã giao hàng thành công và thu đủ tiền (nếu có)?')) {
                              handleUpdateStatus(o.id, o.status);
                          }
                      }}
                      className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                      <CheckCircle size={18} /> Hoàn thành đơn
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
