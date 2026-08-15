import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import { 
    LogOut, User, Mail, Phone, MapPin, ChevronLeft, 
    ShoppingBag, Clock, CheckCircle2, Package, XCircle, ChevronRight, KeyRound, X, Heart, Plus, Trash2, Home
} from "lucide-react"
import { orderApi } from "../api/orders"
import { authApi } from "../api/auth"
import { wishlistApi } from "../api/wishlist"
import { addressApi } from "../api/addresses"
import { formatVnd } from "../utils/format"
import toast from "react-hot-toast"

export default function ProfilePage() {
    const navigate = useNavigate()
    const { user, logout, login } = useAuthStore()
    const [activeTab, setActiveTab] = useState("info")
    const [orders, setOrders] = useState([])
    const [loadingOrders, setLoadingOrders] = useState(false)

    const [wishlist, setWishlist] = useState([])
    const [loadingWishlist, setLoadingWishlist] = useState(false)

    const [addresses, setAddresses] = useState([])
    const [loadingAddresses, setLoadingAddresses] = useState(false)
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [addressForm, setAddressForm] = useState({ fullName: "", phoneNumber: "", addressLine: "", isDefault: false })

    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [updateForm, setUpdateForm] = useState({ fullName: "", phone: "", address: "" })
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [selectedOrder, setSelectedOrder] = useState(null)
    const [showOrderModal, setShowOrderModal] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)

    useEffect(() => {
        if (user) {
            setUpdateForm({
                fullName: user.fullName || "",
                phone: user.phone || "",
                address: user.address || ""
            })
        }
    }, [user])

    useEffect(() => {
        if (!user) {
            navigate("/dang-nhap")
            return
        }

        if (activeTab === "orders") {
            setLoadingOrders(true)
            orderApi.getMyOrders()
                .then(res => setOrders(res))
                .catch(() => toast.error("Không thể tải lịch sử đơn hàng"))
                .finally(() => setLoadingOrders(false))
        }

        if (activeTab === "wishlist") {
            setLoadingWishlist(true)
            wishlistApi.getWishlist()
                .then(res => setWishlist(res))
                .catch(() => toast.error("Không thể tải danh sách yêu thích"))
                .finally(() => setLoadingWishlist(false))
        }

        if (activeTab === "addresses") {
            setLoadingAddresses(true)
            addressApi.getAddresses()
                .then(res => setAddresses(res))
                .catch(() => toast.error("Không thể tải sổ địa chỉ"))
                .finally(() => setLoadingAddresses(false))
        }
    }, [user, activeTab, navigate])

    if (!user) return null

    const handleLogout = () => {
        logout()
        toast.success("Đã đăng xuất thành công")
        navigate("/")
    }

    const infoItems = [
        { icon: <User size={18} />, label: "Họ và tên", value: user.fullName },
        { icon: <Mail size={18} />, label: "Email", value: user.email },
        { icon: <Phone size={18} />, label: "Số điện thoại", value: user.phone || "Chưa cập nhật" },
        { icon: <MapPin size={18} />, label: "Địa chỉ", value: user.address || "Chưa cập nhật" },
    ]

    const getStatusStyle = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return { bg: 'bg-green-50', text: 'text-green-600', icon: <CheckCircle2 size={12} /> };
            case 'pending': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Clock size={12} /> };
            case 'shipping': return { bg: 'bg-blue-50', text: 'text-blue-600', icon: <Package size={12} /> };
            case 'cancelled': return { bg: 'bg-red-50', text: 'text-red-600', icon: <XCircle size={12} /> };
            default: return { bg: 'bg-gray-50', text: 'text-gray-600', icon: <Clock size={12} /> };
        }
    }

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const res = await authApi.updateProfile(updateForm.fullName, updateForm.phone, updateForm.address)
            login(res)
            toast.success("Cập nhật thông tin thành công")
            setShowUpdateModal(false)
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi cập nhật thông tin")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleChangePassword = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
            toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.")
            setShowPasswordModal(false)
            handleLogout()
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi đổi mật khẩu")
        } finally {
            setIsSubmitting(false)
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

    const handleCancelOrder = async (id) => {
        if (!confirm("Bạn có chắc chắn muốn huỷ đơn hàng này?")) return;
        setIsCancelling(true)
        try {
            await orderApi.cancelOrder(id)
            toast.success("Huỷ đơn hàng thành công")
            setShowOrderModal(false)
            // Reload orders
            setLoadingOrders(true)
            const res = await orderApi.getMyOrders()
            setOrders(res)
            setLoadingOrders(false)
        } catch (err) {
            toast.error(err.response?.data?.message || "Lỗi khi huỷ đơn hàng")
        } finally {
            setIsCancelling(false)
        }
    const handleRemoveWishlist = async (e, productId) => {
        e.stopPropagation();
        try {
            await wishlistApi.remove(productId)
            setWishlist(wishlist.filter(item => item.productId !== productId))
            toast.success("Đã xoá khỏi danh sách yêu thích")
        } catch (err) {
            toast.error("Lỗi khi xoá sản phẩm")
        }
    }

    const loadAddresses = async () => {
        const res = await addressApi.getAddresses()
        setAddresses(res)
    }

    const handleAddAddress = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            await addressApi.createAddress(addressForm)
            toast.success("Thêm địa chỉ thành công")
            setShowAddressModal(false)
            setAddressForm({ fullName: "", phoneNumber: "", addressLine: "", isDefault: false })
            await loadAddresses()
        } catch (err) {
            toast.error("Lỗi khi thêm địa chỉ")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteAddress = async (id) => {
        if (!confirm("Bạn có chắc chắn muốn xoá địa chỉ này?")) return;
        try {
            await addressApi.deleteAddress(id)
            toast.success("Đã xoá địa chỉ")
            await loadAddresses()
        } catch (err) {
            toast.error("Lỗi khi xoá địa chỉ")
        }
    }

    const handleSetDefaultAddress = async (id) => {
        try {
            await addressApi.setDefault(id)
            toast.success("Cập nhật địa chỉ mặc định thành công")
            await loadAddresses()
        } catch (err) {
            toast.error("Lỗi cập nhật địa chỉ mặc định")
        }
    }

    return (
        <div className="min-h-screen bg-[#FDFCFD] py-6 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Back Button */}
                <button 
                    onClick={() => navigate("/")}
                    className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors text-[10px] font-black uppercase tracking-widest group"
                >
                    <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Quay về trang chủ
                </button>

                <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_rgba(0,0,0,0.02)] border border-gray-50 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                    
                    {/* Sidebar / Tabs Navigation */}
                    <div className="w-full md:w-60 bg-gray-50/50 border-r border-gray-100 p-6 flex flex-col">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-400 flex items-center justify-center text-lg font-black text-white shadow-lg shadow-pink-100">
                                {user.fullName?.[0]}
                            </div>
                            <div className="min-w-0">
                                <h2 className="font-bold text-gray-900 leading-tight truncate text-sm">{user.fullName}</h2>
                                <p className="text-[9px] text-pink-500 font-black uppercase tracking-widest mt-0.5">Thành viên VIP</p>
                            </div>
                        </div>

                        <nav className="space-y-1.5 flex-1">
                            <button 
                                onClick={() => setActiveTab("info")}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider ${activeTab === "info" ? 'bg-white shadow-sm text-pink-500 border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}
                            >
                                <User size={16} />
                                Thông tin
                            </button>
                            <button 
                                onClick={() => setActiveTab("orders")}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider ${activeTab === "orders" ? 'bg-white shadow-sm text-pink-500 border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}
                            >
                                <ShoppingBag size={16} />
                                Đơn hàng
                            </button>
                            <button 
                                onClick={() => setActiveTab("wishlist")}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider ${activeTab === "wishlist" ? 'bg-white shadow-sm text-pink-500 border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}
                            >
                                <Heart size={16} />
                                Yêu thích
                            </button>
                            <button 
                                onClick={() => setActiveTab("addresses")}
                                className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl transition-all text-[11px] font-black uppercase tracking-wider ${activeTab === "addresses" ? 'bg-white shadow-sm text-pink-500 border border-gray-100' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'}`}
                            >
                                <MapPin size={16} />
                                Sổ địa chỉ
                            </button>
                        </nav>

                        <button 
                            onClick={handleLogout}
                            className="mt-6 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100"
                        >
                            <LogOut size={16} />
                            Đăng xuất
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 p-6 md:p-10">
                        {activeTab === "info" ? (
                            <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <header className="mb-8">
                                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Thông tin tài khoản</h1>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Vui lòng kiểm tra kỹ thông tin nhận hàng</p>
                                </header>

                                <div className="space-y-3">
                                    {infoItems.map((item, idx) => (
                                        <div key={idx} className="group p-4 border border-gray-50 rounded-2xl bg-gray-50/20 hover:border-pink-50 hover:bg-white hover:shadow-xl hover:shadow-pink-50/10 transition-all duration-300">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white border border-gray-50 flex items-center justify-center text-gray-400 group-hover:text-pink-500 group-hover:scale-110 transition-all shadow-sm">
                                                    {item.icon}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-[0.15em]">
                                                        {item.label}
                                                    </p>
                                                    <p className="text-xs font-bold text-gray-800">
                                                        {item.value}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <button 
                                        onClick={() => setShowUpdateModal(true)}
                                        className="flex-1 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all shadow-xl shadow-gray-100 hover:shadow-pink-100 active:scale-[0.98]"
                                    >
                                        Chỉnh sửa thông tin
                                    </button>
                                    <button 
                                        onClick={() => setShowPasswordModal(true)}
                                        className="py-3.5 px-5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2"
                                    >
                                        <KeyRound size={16} />
                                        Đổi mật khẩu
                                    </button>
                                </div>
                            </div>
                        ) : activeTab === "orders" ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <header className="mb-8">
                                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Lịch sử của bạn</h1>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Những món quà yêu thương bạn đã dành tặng</p>
                                </header>

                                {loadingOrders ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-20 bg-gray-50 rounded-2xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : orders.length > 0 ? (
                                    <div className="space-y-3">
                                        {orders.map(order => {
                                            const status = getStatusStyle(order.status);
                                            return (
                                                <div 
                                                    key={order.id} 
                                                    onClick={() => handleViewOrder(order.id)}
                                                    className="group p-4 border border-gray-100 rounded-3xl hover:border-pink-50 hover:bg-white hover:shadow-xl hover:shadow-pink-50/10 transition-all duration-300 cursor-pointer overflow-hidden"
                                                >
                                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                                            <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-pink-50 group-hover:text-pink-500 transition-colors">
                                                                <Package size={20} />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-gray-900 text-sm">Đơn hàng #{order.id}</h3>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className={`flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${status.bg} ${status.text}`}>
                                                                        {status.icon} {order.status}
                                                                    </span>
                                                                    <span className="text-[9px] text-gray-400 font-bold tracking-tight">• {new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-0.5">Tổng giá trị</p>
                                                                <p className="font-black text-pink-500 text-sm">{formatVnd(order.finalAmount)}</p>
                                                            </div>
                                                            <div className="w-8 h-8 rounded-full border border-gray-50 flex items-center justify-center text-gray-300 group-hover:text-pink-500 group-hover:bg-pink-50 transition-all">
                                                                <ChevronRight size={16} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Order Items Preview */}
                                                    <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                                                        {order.items?.map((item, i) => (
                                                            <div key={i} className="flex-shrink-0 flex items-center gap-2 bg-gray-50/50 p-1.5 pr-3 rounded-xl border border-gray-50 group-hover:bg-white group-hover:border-pink-50 transition-all">
                                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-white">
                                                                    <img 
                                                                        src={item.mainImageUrl || "/placeholder-flower.jpg"} 
                                                                        alt={item.productName}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <p className="text-[10px] font-bold text-gray-700 truncate w-24">{item.productName}</p>
                                                                    <p className="text-[9px] text-gray-400 font-medium">x{item.quantity}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center space-y-3 border-2 border-dashed border-gray-50 rounded-[2.5rem]">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                            <ShoppingBag size={32} />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold uppercase tracking-widest text-xs">Chưa có đơn hàng nào</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Hỗ trợ chọn hoa nhanh qua Zalo: 0967.823.155</p>
                                        </div>
                                        <button 
                                            onClick={() => navigate("/hoa")}
                                            className="inline-block px-8 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all"
                                        >
                                            Khám phá cửa hàng
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === "wishlist" ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <header className="mb-8">
                                    <h1 className="text-xl font-black text-gray-900 tracking-tight">Danh sách yêu thích</h1>
                                    <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Những sản phẩm bạn đã lưu lại</p>
                                </header>

                                {loadingWishlist ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-48 bg-gray-50 rounded-3xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : wishlist.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {wishlist.map(item => (
                                            <div key={item.id} onClick={() => navigate(`/san-pham/${item.slug}`)} className="group cursor-pointer">
                                                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-3 bg-gray-50">
                                                    <img 
                                                        src={item.mainImageUrl || "/placeholder-flower.jpg"} 
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                    />
                                                    <button 
                                                        onClick={(e) => handleRemoveWishlist(e, item.productId)}
                                                        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-pink-500 hover:bg-pink-500 hover:text-white transition-colors"
                                                    >
                                                        <Heart size={14} className="fill-current" />
                                                    </button>
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 truncate text-sm">{item.productName}</h3>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {item.isOnSale ? (
                                                            <>
                                                                <span className="font-black text-pink-500">{formatVnd(item.salePrice)}</span>
                                                                <span className="text-xs text-gray-400 line-through font-medium">{formatVnd(item.price)}</span>
                                                            </>
                                                        ) : (
                                                            <span className="font-black text-gray-900">{formatVnd(item.price)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center space-y-3 border-2 border-dashed border-gray-50 rounded-[2.5rem]">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                            <Heart size={32} />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold uppercase tracking-widest text-xs">Chưa có sản phẩm nào</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Hãy thêm những mẫu hoa bạn yêu thích vào đây nhé</p>
                                        </div>
                                        <button 
                                            onClick={() => navigate("/hoa")}
                                            className="inline-block px-8 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all"
                                        >
                                            Khám phá cửa hàng
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : activeTab === "addresses" ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <header className="mb-8 flex justify-between items-center">
                                    <div>
                                        <h1 className="text-xl font-black text-gray-900 tracking-tight">Sổ địa chỉ</h1>
                                        <p className="text-[10px] text-gray-400 mt-1 font-medium italic">Quản lý các địa chỉ nhận hàng của bạn</p>
                                    </div>
                                    <button 
                                        onClick={() => setShowAddressModal(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-pink-50 text-pink-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-pink-500 hover:text-white transition-colors"
                                    >
                                        <Plus size={14} /> Thêm mới
                                    </button>
                                </header>

                                {loadingAddresses ? (
                                    <div className="space-y-4">
                                        {[1, 2].map(i => (
                                            <div key={i} className="h-24 bg-gray-50 rounded-2xl animate-pulse" />
                                        ))}
                                    </div>
                                ) : addresses.length > 0 ? (
                                    <div className="space-y-4">
                                        {addresses.map(addr => (
                                            <div key={addr.id} className={`p-5 rounded-2xl border transition-all relative ${addr.isDefault ? 'border-pink-500 bg-pink-50/10' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                                {addr.isDefault && (
                                                    <div className="absolute top-0 right-0 px-3 py-1 bg-pink-500 text-white rounded-bl-xl text-[9px] font-black uppercase tracking-wider">
                                                        Mặc định
                                                    </div>
                                                )}
                                                <div className="pr-16">
                                                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                        {addr.fullName}
                                                        <span className="text-gray-400 font-normal">|</span>
                                                        <span className="text-gray-600 font-medium">{addr.phoneNumber}</span>
                                                    </h3>
                                                    <p className="text-sm text-gray-600 mt-2">{addr.addressLine}</p>
                                                    
                                                    <div className="flex gap-4 mt-4 text-[10px] font-black uppercase tracking-wider">
                                                        {!addr.isDefault && (
                                                            <button 
                                                                onClick={() => handleSetDefaultAddress(addr.id)}
                                                                className="text-pink-500 hover:text-pink-600"
                                                            >
                                                                Thiết lập mặc định
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleDeleteAddress(addr.id)}
                                                            className="text-gray-400 hover:text-rose-500"
                                                        >
                                                            Xoá
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-16 text-center space-y-3 border-2 border-dashed border-gray-50 rounded-[2.5rem]">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
                                            <MapPin size={32} />
                                        </div>
                                        <div>
                                            <p className="text-gray-900 font-bold uppercase tracking-widest text-xs">Chưa có sổ địa chỉ</p>
                                            <p className="text-[10px] text-gray-400 mt-1">Lưu lại địa chỉ giao nhận để đặt hàng nhanh hơn</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowAddressModal(true)}
                                            className="inline-block px-8 py-3 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all"
                                        >
                                            Thêm địa chỉ ngay
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>

                </div>

                <div className="flex items-center justify-center gap-2 py-2 opacity-40">
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Bảo mật SSL 256-bit</p>
                    <div className="w-1 h-1 rounded-full bg-gray-300" />
                </div>
            </div>

            {/* Update Info Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">Cập nhật thông tin</h2>
                            <button onClick={() => setShowUpdateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Họ và tên</label>
                                <input
                                    required
                                    type="text"
                                    value={updateForm.fullName}
                                    onChange={(e) => setUpdateForm({ ...updateForm, fullName: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Số điện thoại</label>
                                <input
                                    type="tel"
                                    value={updateForm.phone}
                                    onChange={(e) => setUpdateForm({ ...updateForm, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Địa chỉ giao hàng</label>
                                <input
                                    type="text"
                                    value={updateForm.address}
                                    onChange={(e) => setUpdateForm({ ...updateForm, address: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-4 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all shadow-xl shadow-gray-100 hover:shadow-pink-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">Đổi mật khẩu</h2>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Mật khẩu hiện tại</label>
                                <input
                                    required
                                    type="password"
                                    value={passwordForm.currentPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Mật khẩu mới</label>
                                <input
                                    required
                                    type="password"
                                    value={passwordForm.newPassword}
                                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-4 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all shadow-xl shadow-gray-100 hover:shadow-pink-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Đang lưu..." : "Cập nhật mật khẩu"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

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
                                        {getStatusStyle(selectedOrder.status).icon} {selectedOrder.status}
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
                                    {selectedOrder.items?.map((item, i) => (
                                        <div key={i} className="flex gap-4 p-3 bg-white border border-gray-100 rounded-xl">
                                            <img src={item.productImage || "/placeholder-flower.jpg"} alt={item.productName} className="w-16 h-16 object-cover rounded-lg" />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-gray-900 text-sm truncate">{item.productName}</h4>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                                                    <span className="text-sm font-bold text-gray-900">{formatVnd(item.unitPrice)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            {(selectedOrder.status === 'Pending' || selectedOrder.status === 'Processing') && (
                                <div className="pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => handleCancelOrder(selectedOrder.id)}
                                        disabled={isCancelling}
                                        className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rose-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isCancelling ? "Đang huỷ..." : "Huỷ đơn hàng"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Address Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-gray-900">Thêm địa chỉ mới</h2>
                            <button onClick={() => setShowAddressModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleAddAddress} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Họ và tên người nhận</label>
                                <input
                                    required
                                    type="text"
                                    value={addressForm.fullName}
                                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Số điện thoại</label>
                                <input
                                    required
                                    type="tel"
                                    value={addressForm.phoneNumber}
                                    onChange={(e) => setAddressForm({ ...addressForm, phoneNumber: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Địa chỉ cụ thể</label>
                                <textarea
                                    required
                                    value={addressForm.addressLine}
                                    onChange={(e) => setAddressForm({ ...addressForm, addressLine: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none min-h-[100px]"
                                />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                                <input 
                                    type="checkbox" 
                                    id="isDefault" 
                                    checked={addressForm.isDefault}
                                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                                    className="w-4 h-4 text-pink-500 focus:ring-pink-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Đặt làm địa chỉ mặc định
                                </label>
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full mt-4 py-3.5 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-pink-500 transition-all shadow-xl shadow-gray-100 hover:shadow-pink-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Đang lưu..." : "Lưu địa chỉ"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

}