// src/pages/admin/AdminOrders.jsx
import { useState, useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { Eye, RefreshCw, MapPin, Printer } from 'lucide-react';
import apiClient from '../../api/client';
import { formatVnd } from '../../utils/format';
import { resolveImage } from '../../utils/imageResolver';
import toast from 'react-hot-toast';

const STATUSES = ['', 'Pending', 'Processing', 'Shipping', 'Completed', 'Cancelled', 'Refunded'];
const STATUS_LABELS = {
  Pending:    { label: 'Chờ xác nhận', cls: 'bg-yellow-100 text-yellow-700' },
  Processing: { label: 'Đang xử lý', cls: 'bg-blue-100 text-blue-700' },
  Shipping:   { label: 'Đang giao',    cls: 'bg-purple-100 text-purple-700' },
  Completed:  { label: 'Hoàn thành',   cls: 'bg-green-100 text-green-700' },
  Cancelled:  { label: 'Đã hủy',       cls: 'bg-red-100 text-red-700' },
  Refunded: { label: 'Đã hoàn tiền', cls: 'bg-gray-100 text-gray-600' },
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [detail, setDetail] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);
  const PAGE_SIZE = 15;

  const fetchOrders = () => {
    let url = `/orders?page=${page}&pageSize=${PAGE_SIZE}`;
    if (statusFilter) url += `&status=${statusFilter}`;
    if (search) url += `&search=${search}`;
    if (dateFrom) url += `&dateFrom=${dateFrom}`;
    if (dateTo) url += `&dateTo=${dateTo}`;
    apiClient.get(url)
      .then(r => { 
        setOrders(r.data.items ?? []); 
        setTotal(r.data.total ?? 0); 
        setSelectedIds([]); 
      })
      .catch(() => {});
  };

  const fetchStaffMembers = () => {
    apiClient.get('/orders/staff-members')
      .then(r => setStaffMembers(r.data))
      .catch(() => {});
  };

  useEffect(() => { 
    fetchOrders(); 
    fetchStaffMembers();

    // SignalR Connection
    const connection = new HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_API_URL ?? '/api'}`.replace(/\/api$/, '') + '/hubs/orders')
      .withAutomaticReconnect()
      .build();

    let isMounted = true;
    connection.start().catch(err => {
        if (isMounted && !err.toString().includes('stopped during negotiation')) {
            console.error("SignalR Connection Error: ", err);
        }
    });

    connection.on("OrderCreated", (orderSummary) => {
      // Play a ting sound
      try {
        const audio = new Audio('/ting.mp3');
        audio.play().catch(()=>{});
      } catch (e) {}

      // Bật popup in hóa đơn ngay lập tức
      toast.success(`Đơn hàng mới: ${orderSummary.orderCode}`, { duration: 5000 });
      setInvoiceToPrint(orderSummary);
      fetchOrders();
    });

    connection.on("OrderStatusChanged", (data) => {
      fetchOrders();
      if (detail && detail.id === data.id) {
          setDetail(d => ({ ...d, status: data.status }));
      }
    });

    connection.on("OrderCancelled", () => {
      fetchOrders();
    });

    return () => {
        isMounted = false;
        connection.stop();
    };
  }, [page, statusFilter, search, dateFrom, dateTo]);

  async function updateStatus(orderId, status) {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status });
      toast.success('Cập nhật trạng thái thành công');
      fetchOrders();
      if (detail?.id === orderId) setDetail(d => ({ ...d, status }));
    } catch { toast.error('Không thể cập nhật'); }
  }

  async function assignStaff(orderId, staffId) {
    try {
      await apiClient.put(`/orders/${orderId}/assign`, `"${staffId}"`, { headers: { 'Content-Type': 'application/json' } });
      toast.success('Phân công thành công');
      fetchOrders();
    } catch { toast.error('Không thể phân công'); }
  }

  async function handlePrint(orderId) {
    const toastId = toast.loading('Đang tải chi tiết hóa đơn...');
    try {
      const res = await apiClient.get(`/orders/${orderId}`);
      setInvoiceToPrint(res.data);
      toast.dismiss(toastId);
    } catch {
      toast.error('Lỗi khi tải hóa đơn', { id: toastId });
    }
  }

  async function handleBulkUpdate(status) {
    if (selectedIds.length === 0) return;
    try {
      await apiClient.put(`/orders/bulk-status`, { orderIds: selectedIds, status });
      toast.success(`Đã cập nhật ${selectedIds.length} đơn hàng`);
      fetchOrders();
    } catch { toast.error('Không thể cập nhật hàng loạt'); }
  }

  const toggleAll = (e) => {
    if (e.target.checked) setSelectedIds(orders.map(o => o.id));
    else setSelectedIds([]);
  };

  const toggleOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  function getNextAction(status) {
    switch (status) {
      case 'Pending': return { label: 'Xác nhận đơn', next: 'Processing', color: 'bg-blue-500 hover:bg-blue-600' };
      case 'Processing': return { label: 'Giao hàng', next: 'Shipping', color: 'bg-purple-500 hover:bg-purple-600' };
      case 'Shipping': return { label: 'Hoàn thành', next: 'Completed', color: 'bg-green-500 hover:bg-green-600' };
      default: return null;
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Quản lý đơn hàng</h1>
        <p className="text-sm text-gray-400">{total} đơn hàng</p>
      </div>

      {/* Filter tabs and Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => {
            const st = STATUS_LABELS[s];
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors
                  ${statusFilter === s ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s === '' ? 'Tất cả' : (st?.label ?? s)}
              </button>
            );
          })}
        </div>
        <div className="relative w-full md:w-64">
          <input 
            type="text" 
            placeholder="Mã đơn, SĐT, Tên KH..."
            className="input text-sm pl-4 pr-10 py-2 w-full border-gray-200 rounded-full focus:ring-amber-500/20"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Date Range Picker Filters */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Từ ngày:</span>
          <input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} 
            className="input text-sm py-1.5 px-3 border-gray-200 rounded-xl focus:ring-amber-500/20 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Đến ngày:</span>
          <input 
            type="date" 
            value={dateTo} 
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }} 
            className="input text-sm py-1.5 px-3 border-gray-200 rounded-xl focus:ring-amber-500/20 bg-white"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button 
            onClick={() => { setDateFrom(''); setDateTo(''); setPage(1); }}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider ml-auto"
          >
            Xóa bộ lọc ngày
          </button>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between shadow-sm animate-in slide-in-from-top-2">
          <span className="text-sm font-medium text-amber-900">Đã chọn <b>{selectedIds.length}</b> đơn hàng</span>
          <div className="flex gap-2">
            <button onClick={() => handleBulkUpdate('Processing')} className="btn-primary text-xs py-1.5 px-3 bg-blue-500 hover:bg-blue-600 border-none shadow-none text-white">Chuyển sang Đang xử lý</button>
            <button onClick={() => handleBulkUpdate('Shipping')} className="btn-primary text-xs py-1.5 px-3 bg-purple-500 hover:bg-purple-600 border-none shadow-none text-white">Chuyển sang Đang giao</button>
            <button onClick={() => handleBulkUpdate('Completed')} className="btn-primary text-xs py-1.5 px-3 bg-green-500 hover:bg-green-600 border-none shadow-none text-white">Chuyển sang Hoàn thành</button>
            <button onClick={() => handleBulkUpdate('Cancelled')} className="btn-primary text-xs py-1.5 px-3 bg-red-500 hover:bg-red-600 border-none shadow-none text-white">Huỷ các đơn này</button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
<table className="w-full text-sm">
      <thead className="bg-gray-50">
      <tr>
        <th className="px-5 py-3 w-10 text-left"><input type="checkbox" onChange={toggleAll} checked={orders.length > 0 && selectedIds.length === orders.length} className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer" /></th>
    {['Mã đơn', 'Khách hàng', 'Tổng tiền', 'Trạng thái', 'Thao tác nhanh', 'Giao hàng', 'Ngày đặt', ''].map(h => (
     <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
      ))}
           </tr>
       </thead>
     <tbody className="divide-y divide-gray-50">
       {orders.map(o => {
      const st = STATUS_LABELS[o.status] ?? { label: o.status, cls: 'bg-gray-100 text-gray-600' };
      const nextAction = getNextAction(o.status);
       return (
  <tr key={o.id} className={`hover:bg-gray-50 ${selectedIds.includes(o.id) ? 'bg-amber-50/30' : ''}`}>
    <td className="px-5 py-3"><input type="checkbox" checked={selectedIds.includes(o.id)} onChange={() => toggleOne(o.id)} className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer" /></td>
   <td className="px-5 py-3 font-mono text-gray-700">#{o.id}</td>
         <td className="px-5 py-3">
     <p className="font-medium text-gray-800">{o.receiverName}</p>
         <p className="text-xs text-gray-400">{o.receiverPhone}</p>
   </td>
    <td className="px-5 py-3 font-semibold text-gray-900">{formatVnd(o.finalAmount)}</td>
        <td className="px-5 py-3">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
 </td>
        <td className="px-5 py-3 flex gap-2 items-center">
          {nextAction ? (
            <button onClick={() => updateStatus(o.id, nextAction.next)} className={`text-xs font-semibold px-3 py-1.5 rounded-lg text-white shadow-sm transition-all active:scale-95 ${nextAction.color}`}>
              {nextAction.label}
            </button>
          ) : (
            <span className="text-xs text-gray-400"></span>
          )}
          
          <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)}
            className="text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-200 cursor-pointer text-gray-600 focus:ring-amber-500 hover:border-gray-300 bg-white">
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          
          <button 
            onClick={() => handlePrint(o.id)}
            title="In hóa đơn"
            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
          >
            <Printer size={16} />
          </button>
        </td>
        <td className="px-5 py-3">
          {(o.status === 'Processing' || o.status === 'Shipping') ? (
            <select
              value={o.staffId || ''}
              onChange={e => assignStaff(o.id, e.target.value)}
              className="text-xs font-medium px-2 py-1.5 rounded-lg border border-gray-200 text-gray-600 focus:ring-amber-500 bg-white"
            >
              <option value="">-- Chọn NV --</option>
              {staffMembers.map(nv => (
                <option key={nv.id} value={nv.id}>{nv.fullName}</option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-gray-400">
              {o.staffId ? staffMembers.find(n => n.id === o.staffId)?.fullName : '-'}
            </span>
          )}
        </td>
<td className="px-5 py-3 text-gray-400 whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
  <td className="px-5 py-3">
 <button onClick={() => {
    apiClient.get(`/orders/${o.id}`).then(r => setDetail(r.data)).catch(() => toast.error('Lỗi tải chi tiết'));
 }} className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
   <Eye size={15} />
            </button>
         </td>
     </tr>
  );
 })}
        {orders.length === 0 && (
   <tr><td colSpan={8} className="text-center py-12 text-gray-400">Không có đơn hàng nào</td></tr>
      )}
  </tbody>
  </table>
  </div>

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

    {/* Order detail modal */}
      {detail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end md:items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4">
     <div className="flex items-center justify-between">
         <h2 className="font-bold text-gray-900">Chi tiết đơn #{detail.id}</h2>
  <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
       </div>
      <div className="space-y-2 text-sm">
   {[
           ['Khách hàng', detail.receiverName],
    ['Điện thoại', detail.receiverPhone],
         ['Địa chỉ', detail.receiverAddress],
     ['Tổng tiền', formatVnd(detail.finalAmount)],
  ].map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-gray-50 pb-2 last:border-0 last:pb-0">
 <span className="text-gray-500">{k}</span>
<span className="font-medium text-gray-800 text-right">
  {v}
  {k === 'Địa chỉ' && detail.latitude && detail.longitude && (
    <a href={`https://www.google.com/maps?q=${detail.latitude},${detail.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 ml-2 text-blue-500 hover:text-blue-600 font-normal">
      <MapPin size={14} /> Map
    </a>
  )}
</span>
  </div>
   ))}
        </div>
        
        {/* Visual Timeline */}
        <div className="bg-gray-50 rounded-xl p-4 mt-2">
          <h3 className="font-semibold text-gray-800 mb-3 text-xs uppercase tracking-wider">Tiến trình đơn hàng</h3>
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 -z-0"></div>
            {['Pending', 'Processing', 'Shipping', 'Completed'].map((s, idx) => {
              const stages = ['Pending', 'Processing', 'Shipping', 'Completed'];
              const currentIndex = stages.indexOf(detail.status);
              const isPast = stages.indexOf(s) <= currentIndex;
              const isCurrent = detail.status === s;
              const isCancelled = detail.status === 'Cancelled' || detail.status === 'Refunded';
              return (
                <div key={s} className="relative z-10 flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full border-2 mb-1 ${(isPast && !isCancelled) ? 'bg-amber-500 border-amber-500' : 'bg-white border-gray-300'} ${isCurrent ? 'ring-2 ring-amber-200 ring-offset-1' : ''}`}></div>
                  <span className={`text-[10px] font-medium ${(isPast && !isCancelled) ? 'text-amber-600' : 'text-gray-400'}`}>{STATUS_LABELS[s]?.label}</span>
                </div>
              )
            })}
          </div>
          {(detail.status === 'Cancelled' || detail.status === 'Refunded') && (
            <div className="mt-3 text-center text-xs font-bold text-red-500 bg-red-50 p-2 rounded-lg">Đơn hàng đã bị {STATUS_LABELS[detail.status].label.toLowerCase()}</div>
          )}
        </div>

  <div className="border-t pt-4">
   <h3 className="font-semibold text-gray-800 mb-3 text-sm">Sản phẩm</h3>
<div className="space-y-2">
    {detail.items?.map(item => (
      <div key={item.id} className="flex items-center gap-3 text-sm">
   <img src={resolveImage(item.productImage || item.mainImageUrl)} alt={item.productName} className="w-10 h-10 rounded-lg object-cover bg-gray-100" />
    <div className="flex-1">
    <p className="font-medium text-gray-800 line-clamp-1">{item.productName}</p>
    <p className="text-xs text-gray-400">x{item.quantity}</p>
   </div>
    <span className="font-semibold text-gray-900">{formatVnd(item.unitPrice * item.quantity)}</span>
    </div>
          ))}
       </div>
</div>
  </div>
     </div>
      )}
    {/* Invoice Print Modal */}
    {invoiceToPrint && (
      <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center p-4 overflow-y-auto print-bg-transparent" onClick={e => { if(e.target === e.currentTarget) setInvoiceToPrint(null)}}>
        <div className="bg-white w-full max-w-2xl shadow-xl mt-10 mb-10 print:mt-0 print:mb-0" id="print-area">
          {/* Action buttons (hidden when printing) */}
          <div className="flex gap-3 p-4 border-b border-gray-100 print-hide sticky top-0 bg-white z-10">
            <button onClick={() => setInvoiceToPrint(null)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl">Đóng</button>
            <button onClick={() => window.print()} className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                <Printer size={18} /> In Hóa Đơn
            </button>
          </div>

          {/* Actual Receipt */}
          <div className="p-8 bg-white text-black font-sans leading-relaxed receipt-content">
            <div className="text-center mb-8">
              <h2 className="text-4xl font-bold uppercase mb-2 text-gray-800">Lyp Flower</h2>
              <p className="text-base text-gray-600">Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội</p>
              <p className="text-base text-gray-600">Điện thoại: 0123.456.789</p>
            </div>
            
            <div className="text-center border-y-2 border-gray-800 py-4 mb-8">
              <h3 className="text-2xl font-bold uppercase tracking-widest">Hóa Đơn Bán Hàng</h3>
              <p className="text-sm mt-2 text-gray-500">Mã đơn hàng: <strong className="text-gray-800">#{invoiceToPrint.orderCode}</strong></p>
              <p className="text-sm text-gray-500">Ngày in: {new Date().toLocaleString('vi-VN')}</p>
            </div>

            <div className="mb-8 text-base space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p><strong className="w-32 inline-block">Khách hàng:</strong> {invoiceToPrint.receiverName}</p>
              <p><strong className="w-32 inline-block">Điện thoại:</strong> {invoiceToPrint.receiverPhone}</p>
              <p><strong className="w-32 inline-block">Địa chỉ:</strong> {invoiceToPrint.receiverAddress || 'N/A'}</p>
            </div>

            <table className="w-full text-base mb-8">
              <thead>
                <tr className="border-b-2 border-gray-800">
                  <th className="text-left py-3 w-1/2 font-bold uppercase text-sm text-gray-600">Sản phẩm</th>
                  <th className="text-center py-3 w-1/6 font-bold uppercase text-sm text-gray-600">SL</th>
                  <th className="text-right py-3 w-1/3 font-bold uppercase text-sm text-gray-600">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {invoiceToPrint.items?.length > 0 ? invoiceToPrint.items.map(item => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-4 font-medium text-gray-800">{item.productName}</td>
                    <td className="text-center py-4 text-gray-600">{item.quantity}</td>
                    <td className="text-right py-4 font-medium">{formatVnd(item.unitPrice * item.quantity)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="py-4 text-center italic text-gray-500">(Đang tải chi tiết sản phẩm...)</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="space-y-3 text-lg border-b-2 border-gray-800 pb-6 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Phí giao hàng:</span>
                <span>{formatVnd(invoiceToPrint.shippingFee || 0)}</span>
              </div>
              <div className="flex justify-between font-bold text-2xl mt-4 text-gray-900">
                <span>TỔNG TIỀN:</span>
                <span>{formatVnd(invoiceToPrint.finalAmount)}</span>
              </div>
            </div>

            {invoiceToPrint.messageCard && (
              <div className="mb-8 text-base italic border-l-4 border-gray-300 pl-4 py-2 text-gray-600">
                Lời nhắn: "{invoiceToPrint.messageCard}"
              </div>
            )}

            <div className="text-center text-sm text-gray-500 mt-12">
              <p className="font-bold text-gray-800 mb-1">Xin chân thành cảm ơn quý khách!</p>
              <p>Vui lòng kiểm tra lại hàng hóa trước khi thanh toán.</p>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
}
