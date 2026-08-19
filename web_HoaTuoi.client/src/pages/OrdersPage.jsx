import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import { 
    ChevronLeft, ShoppingBag, Clock, CheckCircle2, Package, XCircle, ChevronRight, X, Loader2, Star, Camera
} from "lucide-react"
import { orderApi } from "../api/orders"
import { reviewApi } from "../api/reviews"
import { formatVnd } from "../utils/format"
import { resolveImage } from "../utils/imageResolver"
import toast from "react-hot-toast"
import apiClient from "../api/client"

export default function OrdersPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    const [orders, setOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(true)
    const [filterStatus, setFilterStatus] = useState("all")

    const [selectedOrder, setSelectedOrder] = useState(null)
    const [showOrderModal, setShowOrderModal] = useState(false)
    const [showQrModal, setShowQrModal] = useState(false)
    const [qrInfo, setQrInfo] = useState(null)

    // Trạng thái phục vụ đánh giá sản phẩm trực tiếp từ đơn hàng
    const [activeReviewKey, setActiveReviewKey] = useState(null); // 'orderId_productId'
    const [ratings, setRatings] = useState({}); // { productId: number }
    const [comments, setComments] = useState({}); // { productId: string }
    const [reviewImages, setReviewImages] = useState({}); // { productId: string[] (base64) }
    const [submittingReview, setSubmittingReview] = useState({}); // { productId: boolean }
    const [submittedReviews, setSubmittedReviews] = useState({}); // { 'orderId_productId': { rating, comment } }

    const handleImageUpload = (productId, e) => {
        const files = Array.from(e.target.files);
        const promises = files.map(file => {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result);
                reader.readAsDataURL(file);
            });
        });

        Promise.all(promises).then(base64s => {
            setReviewImages(prev => ({
                ...prev,
                [productId]: [...(prev[productId] || []), ...base64s]
            }));
        });
    };

    const removeImage = (productId, index) => {
        setReviewImages(prev => ({
            ...prev,
            [productId]: prev[productId].filter((_, idx) => idx !== index)
        }));
    };

    const handleSubmitReview = async (orderId, productId) => {
        const rating = ratings[productId] || 5;
        const comment = comments[productId] || "";
        const imageBase64List = reviewImages[productId] || [];

        setSubmittingReview(prev => ({ ...prev, [productId]: true }));
        try {
            await reviewApi.createReview({
                productId,
                rating,
                comment,
                imageBase64List
            });
            toast.success("Cảm ơn bạn đã đánh giá sản phẩm!");
            setSubmittedReviews(prev => ({
                ...prev,
                [`${orderId}_${productId}`]: { rating, comment }
            }));
            setActiveReviewKey(null);
        } catch (err) {
            toast.error(err.response?.data?.message || "Không thể gửi đánh giá.");
        } finally {
            setSubmittingReview(prev => ({ ...prev, [productId]: false }));
        }
    };

    const handlePayNow = () => {
        setQrInfo({
            bankId: 'MB',
            accountNumber: '251099992345',
            accountName: 'NGUYEN TRONG HUNG',
            amount: selectedOrder.finalAmount,
            description: selectedOrder.orderCode,
            orderCode: selectedOrder.orderCode,
            orderId: selectedOrder.id
        });
        setShowOrderModal(false); // Đóng modal chi tiết
        setShowQrModal(true); // Mở modal QR
    };

    useEffect(() => {
        if (!user) {
            navigate("/dang-nhap")
            return
        }

        setLoadingOrders(true)
        orderApi.getMyOrders()
            .then(res => setOrders(res))
            .catch(() => toast.error("Không thể tải lịch sử đơn hàng"))
            .finally(() => setLoadingOrders(false))
    }, [user, navigate])

    if (!user) return null

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return { bg: 'bg-green-50', text: 'text-green-600', icon: <CheckCircle2 size={12} /> };
            case 'placed': return { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: <Clock size={12} /> };
            case 'preparing': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Clock size={12} /> };
            case 'delivering': return { bg: 'bg-purple-50', text: 'text-purple-600', icon: <Package size={12} /> };
            default: return { bg: 'bg-gray-50', text: 'text-gray-600', icon: <Clock size={12} /> };
        }
    }

    const handleViewOrder = async (id) => {
        try {
            const data = await orderApi.getOrder(id)
            setSelectedOrder(data)
            setShowOrderModal(true)
        } catch (err) {
            toast.error("Không thể lấy chi tiết đơn hàng")
        }
    }
    const filteredOrders = orders.filter(order => {
        if (filterStatus === "all") return true;
        const status = order.status?.toLowerCase() || "";
        if (filterStatus === "preparing") return status === "placed" || status === "preparing";
        if (filterStatus === "delivering") return status === "delivering";
        return status === filterStatus;
    });

    const orderTabs = [
        { id: "all", label: "Tất cả" },
        { id: "preparing", label: "Đang chuẩn bị" },
        { id: "delivering", label: "Đang giao" },
        { id: "completed", label: "Hoàn thành" }
    ];

    return (
        <div className="min-h-screen bg-[#FDFCFD] py-6 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Back Button */}
                <button 
                    onClick={() => navigate("/tai-khoan")}
                    className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors text-[10px] font-black uppercase tracking-widest group"
                >
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Quay về tài khoản
                </button>

                <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-gray-50 overflow-hidden min-h-[500px] p-6 md:p-10">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <header className="mb-8">
                            <h1 className="text-xl font-black text-gray-900 tracking-tight">Lịch sử của bạn</h1>
                            <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Những món quà yêu thương bạn đã dành tặng</p>
                        </header>

                        {/* Order Status Filters */}
                        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                            {orderTabs.map(tab => (
                                <button 
                                    key={tab.id} 
                                    onClick={() => setFilterStatus(tab.id)}
                                    className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${filterStatus === tab.id ? 'bg-gray-900 text-white shadow-xl shadow-gray-200' : 'bg-white border border-gray-100 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {tab.label}
                                    {tab.id === 'all' && <span className="ml-1 opacity-50">({orders.length})</span>}
                                </button>
                            ))}
                        </div>

                        {loadingOrders ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse" />
                                ))}
                            </div>
                        ) : filteredOrders.length > 0 ? (
                            <div className="space-y-4">
                                {filteredOrders.map(order => {
                                    const status = getStatusStyle(order.status);
                                    return (
                                        <div 
                                            key={order.id} 
                                            onClick={() => handleViewOrder(order.id)}
                                            className="group p-5 border border-gray-100 rounded-3xl hover:border-pink-50 hover:bg-white hover:shadow-xl hover:shadow-pink-50/10 transition-all duration-300 cursor-pointer overflow-hidden"
                                        >
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
                                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors">
                                                        <Package size={22} />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-sm">Đơn hàng #{order.id}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${status.bg} ${status.text}`}>
                                                                {status.icon} {
                                                                    order.status === 'Placed' ? 'Đã đặt' :
                                                                    order.status === 'Preparing' ? 'Đang chuẩn bị' :
                                                                    order.status === 'Delivering' ? 'Đang giao' :
                                                                    order.status === 'Completed' ? 'Hoàn thành' : order.status
                                                                }
                                                            </span>
                                                            <span className="text-[10px] text-gray-400 font-bold tracking-tight">• {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                    <div className="text-right">
                                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Tổng giá trị</p>
                                                        <p className="font-black text-pink-500 text-lg">{formatVnd(order.finalAmount)}</p>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full border border-gray-50 flex items-center justify-center text-gray-300 group-hover:text-pink-500 group-hover:bg-pink-50 transition-all">
                                                        <ChevronRight size={16} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Order Items Preview */}
                                            <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                                                {order.items?.map((item, i) => (
                                                    <div key={i} className="flex-shrink-0 flex items-center gap-3 bg-gray-50/50 p-2 pr-4 rounded-2xl border border-gray-50 group-hover:bg-white group-hover:border-pink-50 transition-all">
                                                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-100 bg-white">
                                                            <img 
                                                                src={resolveImage(item.mainImageUrl || item.productImage)} 
                                                                alt={item.productName}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-bold text-gray-700 truncate w-32">{item.productName}</p>
                                                            <div className="flex items-center justify-between mt-0.5">
                                                                <p className="text-[10px] text-gray-400 font-medium">x{item.quantity}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="py-20 text-center space-y-4 border-2 border-dashed border-gray-50 rounded-[2.5rem] bg-gray-50/30">
                                <div className="w-20 h-20 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto text-gray-300">
                                    <ShoppingBag size={40} />
                                </div>
                                <div>
                                    <p className="text-gray-900 font-bold uppercase tracking-widest text-sm">Chưa có đơn hàng nào</p>
                                    <p className="text-xs text-gray-400 mt-2">Hỗ trợ chọn hoa nhanh qua Zalo: 0967.823.155</p>
                                </div>
                                <button 
                                    onClick={() => navigate("/hoa")}
                                    className="inline-block mt-4 px-8 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all shadow-xl shadow-gray-200 hover:shadow-pink-200"
                                >
                                    Khám phá cửa hàng
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 py-2 opacity-40">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Bảo mật SSL 256-bit</p>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                </div>
            </div>

            {/* Order Details Modal */}
            {showOrderModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">Chi tiết Đơn hàng #{selectedOrder.id}</h2>
                            <button onClick={() => setShowOrderModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Trạng thái</p>
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg ${getStatusStyle(selectedOrder.status).bg} ${getStatusStyle(selectedOrder.status).text}`}>
                                        {getStatusStyle(selectedOrder.status).icon} {
                                            selectedOrder.status === 'Placed' ? 'Đã đặt' :
                                            selectedOrder.status === 'Preparing' ? 'Đang chuẩn bị' :
                                            selectedOrder.status === 'Delivering' ? 'Đang giao' :
                                            selectedOrder.status === 'Completed' ? 'Hoàn thành' : selectedOrder.status
                                        }
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-1">Ngày đặt</p>
                                    <p className="text-sm font-bold text-gray-900">{new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')} {new Date(selectedOrder.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 border border-gray-100 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Người nhận</p>
                                    <p className="font-bold text-gray-900 mb-1">{selectedOrder.receiverName}</p>
                                    <p className="text-sm text-gray-600 mb-1">{selectedOrder.receiverPhone}</p>
                                    <p className="text-sm text-gray-600 line-clamp-2">{selectedOrder.receiverAddress}</p>
                                </div>
                                <div className="p-4 border border-gray-100 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Thanh toán</p>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tạm tính:</span>
                                            <span className="font-medium">{formatVnd(selectedOrder.totalAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Phí giao hàng:</span>
                                            <span className="font-medium">{formatVnd(selectedOrder.shippingFee)}</span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-gray-100">
                                            <span className="font-bold">Tổng cộng:</span>
                                            <span className="font-black text-pink-500">{formatVnd(selectedOrder.finalAmount)}</span>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${selectedOrder.isPaid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {selectedOrder.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Message Card */}
                            {selectedOrder.messageCard && (
                                <div className="p-4 bg-pink-50/50 border border-pink-100 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase text-pink-400 tracking-wider mb-2">Lời nhắn</p>
                                    <p className="text-sm text-gray-800 italic">"{selectedOrder.messageCard}"</p>
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <p className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3">Sản phẩm</p>
                                <div className="space-y-3">
                                    {selectedOrder.items?.map((item, i) => {
                                        const reviewKey = `${selectedOrder.id}_${item.productId}`;
                                        const isCompleted = selectedOrder.status?.toLowerCase() === 'completed';
                                        const isEditingReview = activeReviewKey === reviewKey;
                                        const submittedData = submittedReviews[reviewKey];

                                        return (
                                            <div key={i} className="p-3 bg-white border border-gray-100 rounded-xl space-y-3">
                                                <div className="flex gap-4">
                                                    <img src={resolveImage(item.mainImageUrl || item.productImage)} alt={item.productName} className="w-16 h-16 object-cover rounded-lg" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-gray-900 text-sm truncate">{item.productName}</h4>
                                                        <div className="flex items-center justify-between mt-2">
                                                            <span className="text-xs text-gray-500">x{item.quantity}</span>
                                                            <span className="text-sm font-bold text-gray-900">{formatVnd(item.unitPrice)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Khung Đánh giá inline */}
                                                {isCompleted && (
                                                    <div className="pt-2 border-t border-dashed border-gray-100">
                                                        {!submittedData ? (
                                                            <div>
                                                                {!isEditingReview ? (
                                                                    <button
                                                                        onClick={() => {
                                                                            setActiveReviewKey(reviewKey);
                                                                            if (!ratings[item.productId]) {
                                                                                setRatings(prev => ({ ...prev, [item.productId]: 5 }));
                                                                            }
                                                                        }}
                                                                        className="inline-flex items-center gap-1.5 text-[10px] font-black text-pink-650 bg-pink-50 hover:bg-pink-100 px-3.5 py-2 rounded-xl uppercase tracking-wider transition-all cursor-pointer"
                                                                    >
                                                                        <Star size={11} className="fill-pink-600 text-pink-600" /> Đánh giá sản phẩm
                                                                    </button>
                                                                ) : (
                                                                    <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top duration-300">
                                                                        {/* Chọn sao */}
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-xs font-bold text-gray-500">Đánh giá:</span>
                                                                            <div className="flex gap-1">
                                                                                {[1, 2, 3, 4, 5].map((star) => {
                                                                                    const isSelected = star <= (ratings[item.productId] || 5);
                                                                                    return (
                                                                                        <button
                                                                                            key={star}
                                                                                            type="button"
                                                                                            onClick={() => setRatings(prev => ({ ...prev, [item.productId]: star }))}
                                                                                            className="text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                                                                                        >
                                                                                            <Star size={18} className={isSelected ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                                                                                        </button>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>

                                                                        {/* Ý kiến */}
                                                                        <textarea
                                                                            value={comments[item.productId] || ""}
                                                                            onChange={(e) => setComments(prev => ({ ...prev, [item.productId]: e.target.value }))}
                                                                            placeholder="Hãy chia sẻ cảm nhận của bạn về bó hoa này nhé..."
                                                                            rows={3}
                                                                            className="w-full text-xs p-3 bg-white border border-gray-150 rounded-xl focus:outline-none focus:border-pink-500 transition-colors resize-none placeholder-gray-400 text-gray-800"
                                                                        />

                                                                        {/* Tải ảnh thực tế */}
                                                                        <div className="space-y-2">
                                                                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[10px] font-black text-gray-500 uppercase tracking-wider bg-white border border-gray-150 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors">
                                                                                <Camera size={12} /> Đính kèm ảnh thực tế
                                                                                <input
                                                                                    type="file"
                                                                                    multiple
                                                                                    accept="image/*"
                                                                                    onChange={(e) => handleImageUpload(item.productId, e)}
                                                                                    className="hidden"
                                                                                />
                                                                            </label>

                                                                            {reviewImages[item.productId]?.length > 0 && (
                                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                                    {reviewImages[item.productId].map((img, idx) => (
                                                                                        <div key={idx} className="relative w-12 h-12 border border-gray-100 rounded-lg overflow-hidden">
                                                                                            <img src={img} className="w-full h-full object-cover" />
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => removeImage(item.productId, idx)}
                                                                                                className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 hover:bg-red-500 transition-colors cursor-pointer"
                                                                                            >
                                                                                                <X size={8} />
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Thao tác */}
                                                                        <div className="flex gap-2 justify-end">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => setActiveReviewKey(null)}
                                                                                className="px-3 py-2 text-[10px] font-bold uppercase text-gray-500 hover:bg-gray-150 rounded-xl transition-colors cursor-pointer"
                                                                            >
                                                                                Hủy
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                disabled={submittingReview[item.productId]}
                                                                                onClick={() => handleSubmitReview(selectedOrder.id, item.productId)}
                                                                                className="flex items-center gap-1.5 bg-[#E92E69] text-white hover:bg-pink-650 px-4 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors shadow-lg shadow-pink-100 cursor-pointer"
                                                                            >
                                                                                {submittingReview[item.productId] ? (
                                                                                    <>
                                                                                        <Loader2 size={10} className="animate-spin" /> Đang gửi...
                                                                                    </>
                                                                                ) : "Gửi đánh giá"}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-green-50/50 border border-green-100 rounded-xl p-3 flex flex-col gap-1.5">
                                                                <div className="flex items-center gap-1.5 text-xs text-green-700 font-bold">
                                                                    <CheckCircle2 size={14} /> Bạn đã đánh giá {submittedData.rating} sao cho sản phẩm này
                                                                </div>
                                                                {submittedData.comment && (
                                                                    <p className="text-xs text-gray-500 italic mt-0.5">"{submittedData.comment}"</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4 border-t border-gray-100 space-y-3">
                                {selectedOrder.status === 'Placed' && !selectedOrder.isPaid && (
                                    <button
                                        onClick={handlePayNow}
                                        className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-md shadow-orange-500/20 active:scale-95 cursor-pointer"
                                    >
                                        Thanh toán ngay (VietQR)
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showQrModal && qrInfo && (
                <QrPaymentModal 
                    qrInfo={qrInfo} 
                    onClose={() => {
                        setShowQrModal(false);
                        // Tải lại danh sách đơn hàng
                        orderApi.getMyOrders().then(res => setOrders(res));
                    }} 
                    navigate={navigate} 
                />
            )}
        </div>
    )
}

// Modal QR thanh toán tự động tái sử dụng cho Lịch sử đơn hàng
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

  // Polling tự động kiểm tra trạng thái đơn hàng
  useEffect(() => {
    if (isSuccess || !qrInfo.orderId) return;
    const pollInterval = setInterval(async () => {
      try {
        const res = await apiClient.get(`/orders/${qrInfo.orderId}`);
        if (res.data && (res.data.isPaid === true || res.data.IsPaid === true)) {
          setIsSuccess(true);
          toast.success('🎉 Hệ thống đã nhận được thanh toán!');
          clearInterval(pollInterval);
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(pollInterval);
  }, [qrInfo.orderId, isSuccess]);

  // Hiệu ứng pháo hoa Confetti khi thành công
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

  // Tự động đóng modal sau 5 giây khi thành công
  useEffect(() => {
    if (!isSuccess) return;
    if (redirectCount <= 0) { onClose(); return; }
    const t = setTimeout(() => setRedirectCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isSuccess, redirectCount, onClose]);

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
        <div className="relative bg-white rounded-3xl p-8 max-w-md w-full text-center shadow-2xl border border-emerald-100 overflow-hidden" style={{ animation: 'scaleUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both' }}>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-white/80 to-white pointer-events-none" style={{ zIndex: 1 }} />
          <div className="relative" style={{ zIndex: 2 }}>
            <div className="relative w-24 h-24 mx-auto mb-4">
              <div className="absolute inset-0 bg-emerald-200 rounded-full animate-ping opacity-30" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-full flex items-center justify-center shadow-xl">
                <span className="text-4xl">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">Thanh Toán Thành Công!</h2>
            <p className="text-sm text-gray-500 mb-6">Đơn hàng của bạn đã chuyển sang trạng thái xử lý.</p>
            <div className="inline-block bg-emerald-50 text-emerald-800 text-xs font-bold px-4 py-2 rounded-full">
              Tự động đóng sau {redirectCount} giây
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl relative" style={{ animation: 'scaleUp 0.3s ease-out both' }}>
          <div className="text-center mb-4">
            <h3 className="text-lg font-black text-gray-900">Quét Mã QR Để Thanh Toán</h3>
            <p className="text-xs text-gray-400 mt-1">Sử dụng ứng dụng ngân hàng bất kỳ để quét mã VietQR</p>
          </div>
          <div className="relative w-56 h-56 mx-auto bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 p-2 mb-4">
            <img src={qrImageUrl} alt="VietQR Code" className="w-full h-full object-contain" />
            {countdown === 0 && (
              <div className="absolute inset-0 bg-white/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                <span className="text-3xl mb-1">⚠️</span>
                <p className="text-xs font-bold text-gray-800">Mã QR đã hết hạn</p>
                <p className="text-[10px] text-gray-400 mt-1">Vui lòng đóng modal và bấm thanh toán lại.</p>
              </div>
            )}
          </div>
          {countdown > 0 && (
            <div className="text-center mb-4">
              <span className="inline-block bg-amber-50 text-amber-700 text-[11px] font-bold px-3 py-1 rounded-full">
                Thời gian còn lại: {minutes}:{seconds}
              </span>
            </div>
          )}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-4 text-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Ngân hàng:</span>
              <span className="font-bold text-gray-900">{qrInfo.bankId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Số tài khoản:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900">{qrInfo.accountNumber}</span>
                <button onClick={() => copyToClipboard(qrInfo.accountNumber, 'Số tài khoản')} className="text-[10px] text-pink-600 font-semibold hover:underline">Sao chép</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Chủ tài khoản:</span>
              <span className="font-bold text-gray-900 uppercase">{qrInfo.accountName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Số tiền:</span>
              <span className="font-bold text-emerald-700">{formatVnd(displayAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
              <span className="text-gray-500 font-medium">Nội dung CK:</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">{qrInfo.description}</span>
                <button onClick={() => copyToClipboard(qrInfo.description, 'Nội dung')} className="text-[10px] text-amber-700 font-semibold hover:underline">Sao chép</button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 mb-4">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="text-blue-500 animate-spin" />
              <div>
                <p className="text-[11px] font-bold text-blue-800">Đang chờ thanh toán...</p>
                <p className="text-[10px] text-blue-500">Hệ thống tự động kiểm tra mỗi 3 giây</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-500 font-medium py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
            Đóng · Thanh toán sau
          </button>
        </div>
      )}
    </div>
  );
}
