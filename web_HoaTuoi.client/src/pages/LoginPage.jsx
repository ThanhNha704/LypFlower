import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { GoogleLogin } from "@react-oauth/google"
import { Toaster } from "react-hot-toast"
import { useAuthStore } from "../store/authStore"
import { authApi } from "../api/auth"
import toast from "react-hot-toast"
import { Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuthStore()

    const [isRegister, setIsRegister] = useState(location.pathname === "/dang-ky")

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
        address: ""
    })

    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    useEffect(() => {
        setIsRegister(location.pathname === "/dang-ky")
    }, [location.pathname])


    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }


    async function handleSubmit(e) {
        e.preventDefault()

        // Basic Validation
        if (isRegister) {
            if (form.password.length < 6) {
                toast.error("Mật khẩu phải có ít nhất 6 ký tự")
                return
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
                toast.error("Email không hợp lệ")
                return
            }
        }

        setLoading(true)
        console.log("Submit:", { isRegister, email: form.email })

        try {
            if (isRegister) {
                await authApi.register(
                    form.fullName,
                    form.email,
                    form.password,
                    form.phone,
                    form.address
                )

                toast.success("Đăng ký thành công! Đang chuyển sang trang đăng nhập...")

                // Clear password but KEEP email for login
                setForm(prev => ({ ...prev, password: "" }))
                setIsRegister(false)

                // Delay a bit for better transition feel
                setTimeout(() => {
                    navigate("/dang-nhap" + location.search, { replace: true })
                }, 500)
            } else {
                const data = await authApi.login(
                    form.email,
                    form.password
                )
                login(data)
                toast.success("Chào mừng bạn quay trở lại!")

                let defaultRedirect = "/";
                if (data.user?.role === "Admin") defaultRedirect = "/admin";
                else if (data.user?.role === "Staff") defaultRedirect = "/nhan-vien";

                const from = new URLSearchParams(location.search).get('from') || defaultRedirect;
                navigate(from, { replace: true })
            }
        } catch (err) {
            console.error("Auth error:", err)
            const msg = err.response?.data?.message || "Lỗi: " + (err.message || "Không thể kết nối đến máy chủ")
            toast.error(msg)
        } finally {
            setLoading(false)
        }
    }


    async function handleGoogleSuccess(credentialResponse) {
        setLoading(true)
        try {
            const data = await authApi.googleLogin(credentialResponse.credential)
            login(data)
            if (data.isNewUser) {
                toast.success("Tạo tài khoản Google thành công! 🎉")
            } else {
                toast.success("Chào mừng bạn quay trở lại! 🌸")
            }

            let defaultRedirect = "/";
            if (data.user?.role === "Admin") defaultRedirect = "/admin";
            else if (data.user?.role === "Staff") defaultRedirect = "/nhan-vien";

            const from = new URLSearchParams(location.search).get('from') || defaultRedirect;
            navigate(from, { replace: true })
        } catch (err) {
            toast.error("Lỗi Google: Đảm bảo Origin đã được cấp quyền")
        } finally {
            setLoading(false)
        }
    }


    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden font-inter p-4">
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
            {/* Background */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat scale-105"
                style={{ backgroundImage: `url('/src/assets/flower_login_bg.png')` }}
            >
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]"></div>
            </div>

            <div className="relative z-10 w-full max-w-[380px]">
                <div className="bg-white/90 backdrop-blur-3xl p-5 md:p-6 rounded-[1.5rem] shadow-[0_25px_60px_rgba(255,182,193,0.2)] border border-white/60 relative">
                    {/* Header - Pro Style */}
                    <div className="text-center mb-5 flex items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 text-white rounded-xl shadow-lg flex items-center justify-center scale-90 group-hover:scale-100 transition-transform">
                            <span className="text-xl">🌸</span>
                        </div>
                        <div className="text-left">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                                {isRegister ? "Đăng ký" : "Đăng nhập"}
                            </h1>
                            <p className="text-[10px] text-pink-400 font-bold uppercase tracking-widest mt-1">
                                {isRegister ? "Join Lyp Flower Membership" : "Nurturing your emotions"}
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {isRegister && (
                            <div className="space-y-2.5 animate-fade-in">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Họ và tên</label>
                                    <input
                                        name="fullName"
                                        placeholder="Ví dụ: Nguyễn Văn A"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">SĐT</label>
                                        <input
                                            name="phone"
                                            placeholder="09..."
                                            value={form.phone}
                                            onChange={handleChange}
                                            className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email</label>
                                        <input
                                            name="email"
                                            type="email"
                                            placeholder="A@gmail.com"
                                            value={form.email}
                                            onChange={handleChange}
                                            className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Địa chỉ nhận hoa</label>
                                    <input
                                        name="address"
                                        placeholder="Số nhà, tên đường, quận/huyện..."
                                        value={form.address}
                                        onChange={handleChange}
                                        className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {!isRegister && (
                            <div className="space-y-1 animate-fade-in">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email của bạn</label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="your-email@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mật khẩu</label>
                                {!isRegister && (
                                    <button
                                        type="button"
                                        onClick={() => navigate("/quen-mat-khau")}
                                        className="text-[9px] font-bold text-pink-500 uppercase hover:text-pink-600"
                                    >
                                        Quên mật khẩu?
                                    </button>
                                )}
                            </div>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={handleChange}
                                    className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {isRegister && <p className="text-[9px] text-gray-400 ml-1 mt-1">* Tổi thiểu 6 ký tự</p>}
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-pink-100 active:scale-[0.98] transition-all disabled:opacity-70 mt-3 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span>{isRegister ? "TẠO TÀI KHOẢN NGAY" : "ĐĂNG NHẬP NGAY"}</span>
                            )}
                        </button>
                    </form>

                    <div className="relative my-4.5 flex items-center">
                        <div className="flex-1 border-t border-gray-100"></div>
                        <span className="px-3 text-[10px] font-bold text-gray-300 uppercase letter-wider">Hoặc tiếp tục với</span>
                        <div className="flex-1 border-t border-gray-100"></div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="w-full flex justify-center">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => toast.error("Đăng nhập Google thất bại")}
                                shape="pill"
                                size="medium"
                                width="100%"
                                theme="outline"
                            />
                        </div>

                        <p className="text-[12px] font-medium text-gray-500">
                            {isRegister ? "Bạn đã có tài khoản?" : "Chưa có tài khoản thành viên?"}
                            <button
                                type="button"
                                onClick={() => navigate(isRegister ? "/dang-nhap" : "/dang-ky")}
                                className="text-pink-600 font-bold ml-1.5 hover:underline decoration-pink-300 underline-offset-4"
                            >
                                {isRegister ? "Đăng nhập ngay" : "Đăng ký ngay"}
                            </button>
                        </p>
                    </div>
                </div>


            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}} />
        </div>
    )
}