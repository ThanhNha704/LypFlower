import { useState, useEffect } from 'react';
import { MapPin, CheckCircle, Package, XCircle, ShoppingBag, Truck, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';
import { formatVnd } from '../../utils/format';
import { resolveImage } from '../../utils/imageResolver';

export default function StaffOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'history'

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

  const handleUpdateStatus = async (orderId, newStatus) => {
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

  // Phân loại đơn hàng
  const pendingOrders = orders.filter(o => o.status === 'Delivering');
  const historyOrders = orders.filter(o => o.status === 'Completed');

  const displayedOrders = activeTab === 'pending' ? pendingOrders : historyOrders;

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500 max-w-lg mx-auto mt-20">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent mx-auto mb-3"></div>
        <p className="font-semibold text-sm">Đang tải danh sách đơn hàng...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-xl mx-auto min-h-screen bg-gray-50/50 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Truck className="text-amber-500" size={22} /> Đơn hàng vận chuyển
        </h1>
        <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
          Tổng: {orders.length} đơn
        </span>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 p-1 bg-gray-200/60 rounded-xl mb-4 border border-gray-100">
        <button
          onClick={() => setActiveTab('pending')}
          className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'pending'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          📦 Đang giao ({pendingOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
            activeTab === 'history'
              ? 'bg-white text-amber-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          📜 Lịch sử ({historyOrders.length})
        </button>
      </div>

      {/* Danh sách đơn */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100 shadow-sm mt-4">
          <ShoppingBag className="mx-auto text-gray-200 mb-2" size={40} />
          <p className="text-xs">Không có đơn hàng nào trong mục này.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedOrders.map(o => (
            <div key={o.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3.5">
              
              {/* Header của thẻ đơn */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    Mã đơn: <span className="font-mono text-amber-600">#{o.orderCode}</span>
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                    <Calendar size={11} />
                    <span>{new Date(o.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>
                
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  o.status === 'Preparing' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                  o.status === 'Delivering' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
                  'bg-green-50 text-green-600 border border-green-200'
                }`}>
                  {o.status === 'Preparing' ? 'Đang chuẩn bị' : 
                   o.status === 'Delivering' ? 'Đang giao' : 
                   'Đã giao'}
                </span>
              </div>

              {/* Danh sách sản phẩm hoa */}
              {o.items && o.items.length > 0 && (
                <div className="border-t border-b border-gray-100 py-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chi tiết bó hoa:</p>
                  {o.items.map((item, idx) => (
                    <div key={idx} className="flex gap-2.5 items-center">
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0">
                        <img 
                          src={resolveImage(item.productImage)} 
                          alt={item.productName} 
                          className="w-full h-full object-cover"
                          onError={e => { e.currentTarget.src = '/placeholder.png'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 truncate">{item.productName}</p>
                        <p className="text-[10px] text-gray-400">Số lượng: {item.quantity} × {formatVnd(item.unitPrice)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Thông tin giao hàng */}
              <div className="bg-amber-50/40 dark:bg-slate-900/10 rounded-xl p-3 text-xs space-y-2 border border-amber-100/30">
                <p><span className="text-gray-500">Khách hàng:</span> <strong className="text-gray-800">{o.receiverName}</strong></p>
                <div className="flex items-center justify-between">
                  <p><span className="text-gray-500">Số điện thoại:</span> <strong className="text-gray-800">{o.receiverPhone}</strong></p>
                  <a href={`tel:${o.receiverPhone}`} className="text-[10px] bg-green-100 hover:bg-green-200 text-green-700 px-2.5 py-1 rounded-lg font-bold transition-all">
                    📞 Gọi điện
                  </a>
                </div>
                <p><span className="text-gray-500">Địa chỉ:</span> <strong className="text-gray-800">{o.receiverAddress}</strong></p>
                
                {/* Nổi bật tiền COD */}
                <div className="pt-1.5 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Trạng thái thu tiền:</span>
                  {o.isPaid ? (
                    <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-200 text-[10px]">
                      ✓ ĐÃ THANH TOÁN
                    </span>
                  ) : (
                    <span className="font-black text-rose-600 text-xs bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      Thu hộ COD: {formatVnd(o.finalAmount)}
                    </span>
                  )}
                </div>
              </div>

              {/* Các nút bấm hành động */}
              {activeTab === 'pending' && (
                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={() => openMap(o.latitude, o.longitude)}
                    className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors border border-blue-100/50"
                  >
                    <MapPin size={14} /> Bản đồ chỉ đường
                  </button>
                  
                  {o.status === 'Delivering' && (
                    <>
                      <button 
                        onClick={() => {
                          if(window.confirm('Xác nhận đã giao hoa thành công và thu đủ tiền (nếu có)?')) {
                            handleUpdateStatus(o.id, 'Completed');
                          }
                        }}
                        className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all shadow-md shadow-green-500/20 active:scale-95"
                      >
                        <CheckCircle size={14} /> Giao thành công
                      </button>
                    </>
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
