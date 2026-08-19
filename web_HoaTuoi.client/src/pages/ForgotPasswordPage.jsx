import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { authApi } from "../api/auth"

export default function ForgotPasswordPage() {
    const navigate = useNavigate()
    
    // 1: Nhập Email, 2: Nhập OTP, 3: Đổi mật khẩu
    const [step, setStep] = useState(1) 
    
    // Form data
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [resetToken, setResetToken] = useState("")
    
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    
    const [loading, setLoading] = useState(false)

    // Bước 1: Gửi Email lấy OTP
    async function handleSendEmail(e) {
        e.preventDefault()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Email không hợp lệ")
            return
        }

        setLoading(true)
        try {
            await authApi.forgotPassword(email)
            toast.success("Đã gửi mã OTP đến email của bạn!")
            setStep(2) // Chuyển sang bước 2
        } catch (err) {
            console.error(err)
            toast.error(err.response?.data?.message || "Lỗi khi gửi email. Vui lòng thử lại.")
        } finally {
            setLoading(false)
        }
    }

    // Bước 2: Xác nhận mã OTP
    async function handleVerifyOtp(e) {
        e.preventDefault()
        if (otp.length < 6) {
            toast.error("Mã OTP phải có 6 chữ số")
            return
        }

        setLoading(true)
        try {
            const data = await authApi.verifyResetOtp(email, otp)
            setResetToken(data.resetToken)
            toast.success("Mã OTP chính xác!")
            setStep(3) // Chuyển sang bước 3
        } catch (err) {
            console.error(err)
            toast.error(err.response?.data?.message || "Mã OTP không đúng hoặc đã hết hạn.")
        } finally {
            setLoading(false)
        }
    }

    // Bước 3: Đổi mật khẩu mới
    async function handleResetPassword(e) {
        e.preventDefault()
        if (newPassword.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự")
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp")
            return
        }

        setLoading(true)
        try {
            await authApi.resetPassword(email, resetToken, newPassword)
            toast.success("Đổi mật khẩu thành công!")
            setTimeout(() => {
                navigate("/dang-nhap")
            }, 1500)
        } catch (err) {
            console.error(err)
            toast.error(err.response?.data?.message || "Lỗi đổi mật khẩu, vui lòng thử lại từ đầu.")
            setStep(1) // Quay lại từ đầu nếu lỗi
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
                <div className="bg-white/90 backdrop-blur-3xl p-5 md:p-6 rounded-[1.5rem] shadow-[0_25px_60px_rgba(255,182,193,0.2)] border border-white/60">
                    
                    {/* Header */}
                    <div className="text-center mb-5 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-xl shadow-lg flex items-center justify-center scale-90 transition-transform">
                            <span className="text-xl">🌸</span>
                        </div>
                        <div className="text-center mt-2">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                                {step === 1 && "Quên mật khẩu?"}
                                {step === 2 && "Nhập mã OTP"}
                                {step === 3 && "Đặt lại mật khẩu"}
                            </h1>
                            <p className="text-xs text-gray-500 mt-2 px-2">
                                {step === 1 && "Nhập email đã đăng ký của bạn. Chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu."}
                                {step === 2 && `Vui lòng kiểm tra hộp thư đến của ${email} để nhận mã 6 số.`}
                                {step === 3 && "Tuyệt vời! Bây giờ hãy đặt một mật khẩu mới thật an toàn."}
                            </p>
                        </div>
                    </div>

                    {/* Form Step 1: Nhập Email */}
                    {step === 1 && (
                        <form onSubmit={handleSendEmail} className="space-y-4 animate-fade-in">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Email của bạn</label>
                                <input
                                    type="email"
                                    placeholder="your-email@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-pink-100 active:scale-[0.98] transition-all disabled:opacity-70 mt-3 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>GỬI MÃ OTP</span>}
                            </button>
                        </form>
                    )}

                    {/* Form Step 2: Nhập OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-4 animate-fade-in">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Mã OTP (6 số)</label>
                                <input
                                    type="text"
                                    placeholder="••••••"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-center tracking-[0.5em] text-lg font-bold"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-pink-100 active:scale-[0.98] transition-all disabled:opacity-70 mt-3 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>XÁC NHẬN MÃ</span>}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-center text-xs text-pink-500 hover:text-pink-600 font-bold mt-2"
                            >
                                Sửa email / Gửi lại mã
                            </button>
                        </form>
                    )}

                    {/* Form Step 3: Đổi Mật Khẩu */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-4 animate-fade-in">
                            <div className="space-y-1 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium pr-10"
                                        required
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
                            <div className="space-y-1 relative">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Xác nhận mật khẩu mới</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium pr-10"
                                        required
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 active:scale-[0.98] transition-all disabled:opacity-70 mt-3 flex items-center justify-center gap-2"
                                disabled={loading}
                            >
                                {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <span>ĐỔI MẬT KHẨU</span>}
                            </button>
                        </form>
                    )}

                    {/* Footer - Back to Login */}
                    {step !== 3 && (
                        <div className="mt-6 text-center">
                            <button
                                type="button"
                                onClick={() => navigate("/dang-nhap")}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                <ArrowLeft size={14} /> Quay lại đăng nhập
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
            `}} />
        </div>
    )
}
