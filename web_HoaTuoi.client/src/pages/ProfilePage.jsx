import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import { 
    LogOut, User, Mail, Phone, MapPin, ChevronLeft, 
    CheckCircle2, Package, XCircle, ChevronRight, KeyRound, X, Plus, Trash2, Home, Eye, EyeOff
} from "lucide-react"
import { authApi } from "../api/auth"
import { addressApi } from "../api/addresses"
import { formatVnd } from "../utils/format"
import { resolveImage } from "../utils/imageResolver"
import toast from "react-hot-toast"
import LocationPicker from "../components/common/LocationPicker"

export default function ProfilePage() {
    const navigate = useNavigate()
    const { user, logout, login } = useAuthStore()
    const [activeTab, setActiveTab] = useState("info")


    const [addresses, setAddresses] = useState([])
    const [loadingAddresses, setLoadingAddresses] = useState(false)
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [addressForm, setAddressForm] = useState({ fullName: "", phoneNumber: "", addressLine: "", isDefault: false, latitude: null, longitude: null })

    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [updateForm, setUpdateForm] = useState({ fullName: "", phone: "", address: "" })
    const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)

    useEffect(() => {
        if (user) {
            setUpdateForm({
                fullName: user.fullName || "",
                phone: user.phone || "",
                address: user.address || ""
            })
        }
    }, [user])

    const location = useLocation()
    useEffect(() => {
        if (location.pathname === "/tai-khoan") {
            setActiveTab("info")
        }
    }, [location.pathname])

    useEffect(() => {
        if (!user) {
            navigate("/dang-nhap")
            return
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
            setAddressForm({ fullName: "", phoneNumber: "", addressLine: "", isDefault: false, latitude: null, longitude: null })
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
                            <div className="relative">
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Mật khẩu hiện tại</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none pr-10"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <div className="relative">
                                <label className="block text-[10px] font-black uppercase text-gray-500 tracking-wider mb-2">Mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        required
                                        type={showNewPassword ? "text" : "password"}
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none pr-10"
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
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
                            <LocationPicker 
                                onLocationSelected={({latitude, longitude}) => setAddressForm({ ...addressForm, latitude, longitude })} 
                            />
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
