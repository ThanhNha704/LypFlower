// src/pages/CheckoutPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { formatVnd } from '../utils/format';
import { resolveImage } from '../utils/imageResolver';
import apiClient from '../api/client';
import { addressApi } from '../api/addresses';
import toast from 'react-hot-toast';
import { MapPin, QrCode, Banknote, X, CheckCircle, User, Phone, MessageSquare, Calendar, ChevronRight, ShoppingBag, CreditCard, Truck, ArrowLeft, Loader2 } from 'lucide-react';
import LocationPicker from '../components/common/LocationPicker';

// ============================================================
// Modal QR thanh toán - Tự động xác nhận & Chuyên nghiệp
// ============================================================
function QrPaymentModal({ qrInfo, onClose, navigate }) {
  const [countdown, setCountdown] = useState(600); // 10 phút
  const [isSuccess, setIsSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [redirectCount, setRedirectCount] = useState(5);
  const canvasRef = useRef(null);

  const displayAmount = Math.max(2000, qrInfo.amount || 0);
  const qrImageUrl = `https://img.vietqr.io/image/${qrInfo.bankId}-${qrInfo.accountNumber}-qr_only.png?amount=${displayAmount}&addInfo=${encodeURIComponent(qrInfo.description)}&accountName=${encodeURIComponent(qrInfo.accountName)}`;

  // Đếm ngược 10 phút
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Polling tự động check trạng thái thanh toán từ Server (khi có Webhook hoặc Admin duyệt)
  useEffect(() => {
    if (isSuccess || !qrInfo.orderId) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/orders/${qrInfo.orderId}`);
        // Kiểm tra cả camelCase và PascalCase
        if (res.data && (res.data.isPaid === true || res.data.IsPaid === true)) {
          setIsSuccess(true);
          toast.success('🎉 Hệ thống đã nhận được thanh toán!');
          clearInterval(pollInterval);
        }
      } catch (e) { /* bỏ qua lỗi tạm thời */ }
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [qrInfo.orderId, isSuccess]);

  // Confetti animation khi thành công
  useEffect(() => {
    if (!isSuccess) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    const COLORS = ['#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6','#ef4444','#06b6d4'];
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 7 + 3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      speed: Math.random() * 3 + 1.5,
      drift: (Math.random() - 0.5) * 2,
      rotate: Math.random() * 360,
      rotateSpeed: (Math.random() - 0.5) * 10,
    }));
    let animId;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotate * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.6);
        ctx.restore();
        p.y += p.speed;
        p.x += p.drift;
        p.rotate += p.rotateSpeed;
        if (p.y > canvas.height) { p.y = -10; p.x = Math.random() * canvas.width; }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    const stop = setTimeout(() => cancelAnimationFrame(animId), 4500);
    return () => { cancelAnimationFrame(animId); clearTimeout(stop); };
  }, [isSuccess]);

  // Tự động redirect sau 5 giây khi thanh toán thành công
  useEffect(() => {
    if (!isSuccess) return;
    if (redirectCount <= 0) { navigate('/don-hang'); return; }
    const t = setTimeout(() => setRedirectCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isSuccess, redirectCount, navigate]);

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(`Đã sao chép ${field}`);
    setTimeout(() => setCopiedField(null), 2000);
  };


  const minutes = String(Math.floor(countdown / 60)).padStart(2, '0');
  const seconds = String(countdown % 60).padStart(2, '0');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      {isSuccess ? (
        /* ===== MÀN HÌNH THANH TOÁN THÀNH CÔNG 🎉 ===== */
        <div
          className="relative bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-emerald-100 overflow-hidden"
          style={{ animation: 'scaleUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}
        >
          {/* Confetti canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-white/80 to-white pointer-events-none" style={{ zIndex: 1 }} />

          <div className="relative" style={{ zIndex: 2 }}>
            {/* Animated icon */}
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-30" />
              <div className="absolute inset-2 bg-emerald-100 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.3s' }} />
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/40">
                <CheckCircle size={52} strokeWidth={2} />
              </div>
            </div>

            <p className="text-3xl mb-2">🎉</p>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Thanh Toán Thành Công!</h2>
            <p className="text-xs text-gray-500 mb-5 leading-relaxed">
              Đã nhận khoản thanh toán{' '}
              <strong className="text-emerald-700">{formatVnd(displayAmount)}</strong> cho đơn{' '}
              <span className="bg-emerald-50 text-emerald-800 font-mono font-bold px-2 py-0.5 rounded border border-emerald-200">
                {qrInfo.orderCode}
              </span>
            </p>

            {/* Info card */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left text-xs space-y-2 border border-gray-100">
              {[
                { label: 'Mã đơn hàng', value: qrInfo.orderCode },
                { label: 'Ngân hàng nhận', value: qrInfo.bankId || 'MBBANK' },
                { label: 'Chủ tài khoản', value: qrInfo.accountName || 'NGUYEN TRONG HUNG' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}:</span>
                  <span className="font-semibold text-gray-800">{value}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái:</span>
                <span className="font-bold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                  Đã thanh toán · Đang xử lý
                </span>
              </div>
            </div>

            {/* Countdown bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                  style={{ width: `${(redirectCount / 5) * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                Tự động chuyển đến đơn hàng sau <strong>{redirectCount}s</strong>...
              </p>
            </div>

            <button
              onClick={() => navigate('/don-hang')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <CheckCircle size={18} />
              Xem đơn hàng ngay
            </button>
          </div>
        </div>
      ) : (
        /* ===== MÀN HÌNH QUÉT MÃ QR VIETQR ===== */
        <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl max-h-[92vh] overflow-y-auto border border-gray-100 relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                <QrCode size={22} />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Quét mã thanh toán VietQR</h3>
                <p className="text-xs text-gray-500">Dùng App Ngân hàng hoặc Ví điện tử để quét</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Banner hướng dẫn */}
          <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3 mb-4 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
            <span className="text-base leading-none">📲</span>
            <div>
              <strong>Hướng dẫn:</strong> Mở App ngân hàng, quét mã QR bên dưới để chuyển khoản đúng nội dung. Hệ thống sẽ <strong>tự động xác nhận</strong> và chuyển sang màn hình thành công.
            </div>
          </div>

          {/* QR Image */}
          <div className="bg-gradient-to-b from-amber-50/40 to-orange-50/20 p-4 rounded-2xl border border-amber-100/80 text-center mb-4 flex flex-col items-center">
            <div className="bg-white p-3 rounded-xl shadow-md border border-gray-100 max-w-[220px] mb-2.5">
              <img src={qrImageUrl} alt="VietQR Thanh Toán" className="w-full h-auto rounded-lg" />
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-semibold text-gray-600 bg-white/90 backdrop-blur-sm px-4 py-1 rounded-full border border-gray-200 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Thời gian còn lại: {minutes}:{seconds}
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-gray-50 rounded-2xl p-3.5 mb-3 text-xs space-y-2 border border-gray-200/80">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Ngân hàng:</span>
              <span className="font-bold text-gray-800">{qrInfo.bankId === 'MB' ? 'Ngân hàng Quân Đội (MBBANK)' : qrInfo.bankId || 'MBBANK'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Số tài khoản:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-900 bg-amber-100/60 px-2 py-0.5 rounded">{qrInfo.accountNumber}</span>
                <button onClick={() => copyToClipboard(qrInfo.accountNumber, 'Số tài khoản')} className="text-[11px] text-amber-700 hover:underline font-semibold">
                  {copiedField === 'Số tài khoản' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Chủ tài khoản:</span>
              <span className="font-bold text-gray-800">{qrInfo.accountName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Số tiền:</span>
              <span className="font-bold text-emerald-700 text-sm">{formatVnd(displayAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-500 font-medium">Nội dung CK:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">{qrInfo.description}</span>
                <button onClick={() => copyToClipboard(qrInfo.description, 'Nội dung')} className="text-[11px] text-amber-700 hover:underline font-semibold">
                  {copiedField === 'Nội dung' ? '✓ Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>
          </div>

          {/* Auto polling status */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl px-4 py-3 mb-3">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="text-blue-500 animate-spin" />
              <div>
                <p className="text-[11px] font-bold text-blue-800">Đang chờ thanh toán...</p>
                <p className="text-[10px] text-blue-500">Hệ thống tự động kiểm tra mỗi 3 giây</p>
              </div>
            </div>
            <div className="flex gap-0.5">
              {[0,1,2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-blue-400"
                  style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
          </div>

          {/* Chỉ còn nút Để sau */}
          <button
            onClick={onClose}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-medium py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <X size={13} />
            Đóng · xem đơn hàng sau
          </button>
        </div>
      )}
    </div>
  );
}


// ============================================================
// Trang Checkout chính
// ============================================================
export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { state } = useLocation();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user) {
      navigate(`/dang-nhap?from=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [user, navigate, location]);

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [qrInfo, setQrInfo] = useState(null);
  const [form, setForm] = useState({
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    latitude: null,
    longitude: null,
    messageCard: '',
    deliveryTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16),
  });
  const [isStorePickup, setIsStorePickup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('QrCode');
  const shippingFee = isStorePickup ? 0 : 30000;
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        receiverName: user.fullName || '',
        receiverPhone: user.phone || '',
        receiverAddress: user.address || '',
      }));

      addressApi.getAddresses()
        .then(res => {
          setSavedAddresses(res);
          const defaultAddr = res.find(a => a.isDefault);
          if (defaultAddr) {
            setForm(f => ({
              ...f,
              receiverName: defaultAddr.fullName,
              receiverPhone: defaultAddr.phoneNumber,
              receiverAddress: defaultAddr.addressLine,
              latitude: defaultAddr.latitude,
              longitude: defaultAddr.longitude,
            }));
          }
        })
        .catch(console.error);
    }
  }, [user]);

  const handleSelectAddress = (addr) => {
    setForm(f => ({
      ...f,
      receiverName: addr.fullName,
      receiverPhone: addr.phoneNumber,
      receiverAddress: addr.addressLine,
      latitude: addr.latitude,
      longitude: addr.longitude,
    }));
  };

  const subtotal = state?.finalAmount ?? items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discountAmount = state?.discountAmount ?? 0;
  const finalAmount = subtotal + shippingFee;

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

  async function handlePlaceOrder() {
    if (submitted) return;
    if (!form.receiverName || !form.receiverPhone || (!isStorePickup && !form.receiverAddress)) {
      return toast.error('Vui lòng điền đầy đủ thông tin');
    }
    setLoading(true);
    setSubmitted(true);
    try {
      const payload = {
        type: 'Retail',
        paymentMethod,
        ...form,
        deliveryTime: form.deliveryTime ? form.deliveryTime : null,
        messageCard: form.messageCard ? form.messageCard : null,
        voucherCode: form.voucherCode ? form.voucherCode : null,
        isStorePickup,
        shippingFee,
        items: items.map(i => ({
          productId: i.productId,
          productName: i.productName,
          mainImageUrl: i.mainImageUrl,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        })),
      };

      const res = await apiClient.post('/orders', payload);

      if (paymentMethod === 'QrCode' && res.data.qrInfo) {
        // Hiển thị modal QR
        setQrInfo(res.data.qrInfo);
        clearCart();
        toast.success('Đơn hàng đã tạo! Quét QR để thanh toán.');
      } else {
        clearCart();
        toast.success('Đặt hàng thành công!');
        navigate('/');
      }
    } catch (err) {
      setSubmitted(false);
      const msg = err.response?.status === 409
        ? err.response.data.message
        : err.response?.status === 429
          ? 'Bạn đang gửi quá nhiều yêu cầu, vui lòng chờ 1 phút'
          : err.response?.data?.message ?? 'Có lỗi xảy ra, vui lòng thử lại';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleQrClose() {
    setQrInfo(null);
    navigate('/don-hang');
  }

  return (
    <>
      {/* Modal QR */}
      {qrInfo && (
        <QrPaymentModal
          qrInfo={qrInfo}
          onClose={handleQrClose}
          navigate={navigate}
        />
      )}

      <div className="min-h-screen bg-[#fdfdfb] dark:bg-[#121212] transition-colors pt-2 pb-6">
        <div className="max-w-6xl mx-auto px-4">
          
          {/* === Breadcrumbs === */}
          <nav className="flex items-center gap-2 text-[10px] font-medium text-gray-400 mb-3 overflow-x-auto whitespace-nowrap">
            <button onClick={() => navigate('/gio-hang')} className="hover:text-amber-600 transition-colors flex items-center gap-1">
              <ShoppingBag size={10} /> Giỏ hàng
            </button>
            <ChevronRight size={8} />
            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full">Thanh toán</span>
            <ChevronRight size={8} />
            <span className="opacity-50 text-gray-400">Hoàn tất</span>
          </nav>

          <div className="flex items-end justify-between gap-3 mb-3">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-gray-100 font-playfair tracking-tight">Thanh toán</h1>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Hoàn tất đơn hàng của bạn.</p>
            </div>
            <button onClick={() => navigate('/gio-hang')} className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 hover:text-amber-800 transition-colors">
              <ArrowLeft size={12} /> Quay lại
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-start">

            {/* === CỘT TRÁI: THÔNG TIN === */}
            <div className="lg:col-span-7 space-y-3">
              
              {/* Mục: Thông tin người nhận */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400">
                    <User size={14} />
                  </div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-gray-200 font-playfair tracking-wide uppercase">Thông tin người nhận</h2>
                </div>

                {!isStorePickup && savedAddresses.length > 0 && (
                  <div className="mb-3">
                    <label className="section-label">Từ sổ địa chỉ</label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide pt-0.5">
                      {savedAddresses.map(addr => (
                        <button
                          key={addr.id}
                          onClick={() => handleSelectAddress(addr)}
                          className={`flex-shrink-0 flex items-start gap-2 p-2 rounded-xl border text-left transition-all w-[180px] relative group ${form.receiverAddress === addr.addressLine && form.receiverPhone === addr.phoneNumber ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400/30' : 'border-gray-100 bg-white hover:border-amber-200'}`}
                        >
                          <div className={`mt-0.5 p-1 rounded-lg shrink-0 ${form.receiverAddress === addr.addressLine ? 'bg-amber-100 text-amber-600' : 'bg-gray-50 text-gray-400'}`}>
                            <MapPin size={12} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-900 truncate">{addr.fullName}</p>
                            <p className="text-[9px] text-gray-500 mt-0.5">{addr.phoneNumber}</p>
                          </div>
                          {form.receiverAddress === addr.addressLine && form.receiverPhone === addr.phoneNumber && (
                            <div className="absolute top-1 right-1">
                              <CheckCircle size={10} className="text-amber-600" fill="#fffbeb" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="relative group">
                      <label className="section-label">Họ và tên</label>
                      <div className="relative">
                        <User size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600" />
                        <input name="receiverName" type="text" value={form.receiverName} onChange={handleChange}
                          className="input pl-9 h-9 text-xs border-gray-100 bg-gray-50/30 focus:bg-white" placeholder="Họ tên người nhận..." />
                      </div>
                    </div>
                    <div className="relative group">
                      <label className="section-label">Số điện thoại</label>
                      <div className="relative">
                        <Phone size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-600" />
                        <input name="receiverPhone" type="tel" value={form.receiverPhone} onChange={handleChange}
                          className="input pl-9 h-9 text-xs border-gray-100 bg-gray-50/30 focus:bg-white" placeholder="SĐT..." />
                      </div>
                    </div>
                  </div>

                  {!isStorePickup && (
                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="section-label">Địa chỉ giao hàng</label>
                      <div className="relative group mb-3">
                        <MapPin size={12} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-amber-600" />
                        <textarea name="receiverAddress" value={form.receiverAddress} onChange={handleChange}
                          rows={1} className="input pl-9 pt-2 h-9 bg-gray-50/30 border-gray-100 focus:bg-white resize-none text-xs"
                          placeholder="Địa chỉ..." />
                      </div>
                      <LocationPicker 
                          initialPosition={form.latitude ? { lat: form.latitude, lng: form.longitude } : null}
                          onLocationSelected={({latitude, longitude}) => setForm(f => ({ ...f, latitude, longitude }))} 
                      />
                    </div>
                  )}

                  {isStorePickup && (
                    <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 animate-in fade-in slide-in-from-top-1 duration-200 flex gap-2">
                      <MapPin size={16} className="text-amber-600 shrink-0" />
                      <div>
                        <p className="text-[9px] font-bold text-amber-800 uppercase tracking-widest mb-0.5">Nhận tại cửa hàng:</p>
                        <p className="text-xs text-gray-700 font-medium font-mono">613 Âu Cơ, Tân Phú, Hồ Chí Minh 700000, Việt Nam</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mục: Thời gian & Lời nhắn */}
              <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-4 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] border border-gray-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Calendar size={12} />
                    </div>
                    <h2 className="text-xs font-bold text-gray-800 dark:text-gray-200">Thời gian nhận</h2>
                  </div>
                  <input name="deliveryTime" type="datetime-local" value={form.deliveryTime} onChange={handleChange}
                    className="input h-9 text-xs bg-gray-50/30 dark:bg-slate-900/30 border-gray-100 dark:border-slate-800 dark:text-gray-200 focus:bg-white dark:focus:bg-[#222]" />
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                      <MessageSquare size={12} />
                    </div>
                    <h2 className="text-xs font-bold text-gray-800">Lời nhắn trên thiệp</h2>
                  </div>
                  <textarea name="messageCard" value={form.messageCard} onChange={handleChange}
                    rows={1} className="input h-9 pt-2 bg-gray-50/30 border-gray-100 focus:bg-white resize-none text-xs"
                    placeholder="Lời chúc..." />
                </div>
              </div>
            </div>

            {/* === CỘT PHẢI: TÓM TẮT & THANH TOÁN === */}
            <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-4">
              
              <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl overflow-hidden shadow-[0_4px_25px_-5px_rgba(0,0,0,0.1)] border border-gray-100 dark:border-slate-800">
                {/* Header Tóm tắt */}
                <div className="bg-gray-50/80 dark:bg-[#151515]/80 px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag size={14} className="text-amber-700 dark:text-amber-500" />
                    <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 font-playfair uppercase tracking-wider">Tóm tắt</h2>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500 bg-amber-100/50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">{items.length} món</span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Vận chuyển switch */}
                  <div className="grid grid-cols-2 p-1 bg-gray-100/80 rounded-xl relative">
                    <button
                      onClick={() => setIsStorePickup(false)}
                      className={`relative z-10 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 ${!isStorePickup ? 'text-amber-800' : 'text-gray-400'}`}
                    >
                      <Truck size={12} /> Giao tận nơi
                    </button>
                    <button
                      onClick={() => setIsStorePickup(true)}
                      className={`relative z-10 py-1.5 text-[10px] font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-1.5 ${isStorePickup ? 'text-amber-800' : 'text-gray-400'}`}
                    >
                      <ShoppingBag size={12} /> Cửa hàng
                    </button>
                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 transform ${isStorePickup ? 'translate-x-full left-1' : 'translate-x-0 left-1'}`} />
                  </div>

                  {/* List items */}
                  <div className="space-y-2 max-h-[90px] overflow-y-auto pr-1 custom-scrollbar border-b border-dashed border-gray-200 dark:border-slate-700 pb-2">
                    {items.map(i => (
                      <div key={i.productId} className="flex gap-2.5 animate-in fade-in transition-all">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-slate-800 shrink-0">
                          <img
                            src={resolveImage(i.mainImageUrl)}
                            alt={i.productName}
                            className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.src = '/placeholder.png'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">{i.productName}</p>
                          <div className="flex justify-between items-center mt-0.5">
                            <span className="text-[10px] text-gray-400">× {i.quantity}</span>
                            <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{formatVnd(i.unitPrice * i.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Phương thức thanh toán */}
                  <div className="space-y-2">
                    <label className="section-label flex items-center gap-1">
                      <CreditCard size={10} /> Thanh toán
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div
                        onClick={() => setPaymentMethod('QrCode')}
                        className={`group relative p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2.5 ${paymentMethod === 'QrCode' ? 'border-amber-400 bg-amber-50/40' : 'border-gray-100 bg-gray-50/50 hover:border-amber-200'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${paymentMethod === 'QrCode' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-white text-gray-400 border border-gray-100'}`}>
                          <QrCode size={16} />
                        </div>
                        <div>
                          <p className={`text-[11px] font-bold ${paymentMethod === 'QrCode' ? 'text-amber-800' : 'text-gray-700'}`}>VietQR</p>
                          <p className="text-[9px] text-gray-400">Chuyển khoản</p>
                        </div>
                        {paymentMethod === 'QrCode' && <CheckCircle size={12} className="absolute top-1.5 right-1.5 text-amber-500" fill="#fffbeb" />}
                      </div>

                      <div
                        onClick={() => setPaymentMethod('COD')}
                        className={`group relative p-3 border-2 rounded-xl cursor-pointer transition-all duration-200 flex items-center gap-2.5 ${paymentMethod === 'COD' ? 'border-amber-400 bg-amber-50/40' : 'border-gray-100 bg-gray-50/50 hover:border-amber-200'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${paymentMethod === 'COD' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30' : 'bg-white text-gray-400 border border-gray-100'}`}>
                          <Banknote size={16} />
                        </div>
                        <div>
                          <p className={`text-[11px] font-bold ${paymentMethod === 'COD' ? 'text-amber-800' : 'text-gray-700'}`}>Tiền mặt</p>
                          <p className="text-[9px] text-gray-400">Thanh toán khi nhận</p>
                        </div>
                        {paymentMethod === 'COD' && <CheckCircle size={12} className="absolute top-1.5 right-1.5 text-amber-500" fill="#fffbeb" />}
                      </div>
                    </div>
                  </div>

                  {/* Tổng kết tiền */}
                  <div className="bg-gray-50/50 dark:bg-slate-900/30 rounded-xl p-3 space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-medium">Tạm tính</span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{formatVnd(subtotal)}</span>
                    </div>
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-amber-600 dark:text-amber-500 font-medium">Giảm giá voucher</span>
                        <span className="font-bold text-amber-600 dark:text-amber-500">- {formatVnd(discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-gray-500 font-medium">Phí giao</span>
                      <span className={`font-bold ${isStorePickup ? 'text-green-600 dark:text-green-500' : 'text-gray-800 dark:text-gray-200'}`}>
                        {isStorePickup ? 'Free' : formatVnd(shippingFee)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-dashed border-gray-200 dark:border-slate-700 flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black uppercase text-gray-400 dark:text-gray-500 tracking-tighter mb-0.5">Tổng cộng</p>
                        <span className="text-2xl font-black text-amber-600 dark:text-amber-500 font-playfair tracking-tighter">{formatVnd(finalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Nút đặt hàng */}
                  <div className="pt-0">
                    <button onClick={handlePlaceOrder} disabled={loading || submitted}
                      className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-900/10 hover:bg-amber-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden">
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                        {submitted && !qrInfo ? 'Đang xử lý...' : loading ? 'Chờ xíu...' : paymentMethod === 'QrCode' ? <>Thanh toán <ChevronRight size={14} /></> : <>Xác nhận thanh toán <CheckCircle size={14} /></>}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              
              <p className="text-[9px] text-gray-400 text-center mt-3 font-medium">
                Bằng việc đặt hàng, bạn đồng ý với <span className="text-amber-700 underline decoration-amber-200 underline-offset-2">Chính sách</span> của chúng tôi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
