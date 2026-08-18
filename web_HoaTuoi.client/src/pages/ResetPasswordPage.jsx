import { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Toaster } from "react-hot-toast"
import toast from "react-hot-toast"
import { authApi } from "../api/auth"

export default function ResetPasswordPage() {
    const navigate = useNavigate()
    const location = useLocation()
    
    // Lấy token và email từ URL: ?token=...&email=...
    const searchParams = new URLSearchParams(location.search)
    const token = searchParams.get("token") || ""
    const email = searchParams.get("email") || ""
    
    const [form, setForm] = useState({
        newPassword: "",
        confirmPassword: ""
    })
    const [loading, setLoading] = useState(false)

    function handleChange(e) {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        
        if (form.newPassword.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự")
            return
        }

        if (form.newPassword !== form.confirmPassword) {
            toast.error("Mật khẩu xác nhận không khớp")
            return
        }

        setLoading(true)
        
        try {
            await authApi.resetPassword(email, token, form.newPassword)
            toast.success("Đổi mật khẩu thành công!")
            setTimeout(() => {
                navigate("/dang-nhap")
            }, 1500)
        } catch (err) {
            console.error(err)
            toast.error(err.response?.data?.message || "Lỗi đổi mật khẩu, link có thể đã hết hạn.")
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
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-400 text-white rounded-xl shadow-lg flex items-center justify-center scale-90 transition-transform">
                            <span className="text-xl">🌸</span>
                        </div>
                        <div className="text-center mt-2">
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">
                                Đặt lại mật khẩu
                            </h1>
                            <p className="text-xs text-gray-500 mt-2 px-2">
                                Vui lòng nhập mật khẩu mới cho tài khoản của bạn.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1 animate-fade-in">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Mật khẩu mới</label>
                            <input
                                name="newPassword"
                                type="password"
                                placeholder="••••••••"
                                value={form.newPassword}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                                required
                            />
                        </div>

                        <div className="space-y-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider ml-1">Xác nhận mật khẩu mới</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                className="w-full px-3.5 py-2.5 bg-white border border-pink-50 rounded-xl focus:ring-2 focus:ring-pink-100 focus:border-pink-300 outline-none transition-all text-sm font-medium"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-pink-100 active:scale-[0.98] transition-all disabled:opacity-70 mt-5 flex items-center justify-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span>XÁC NHẬN ĐỔI MẬT KHẨU</span>
                            )}
                        </button>
                    </form>

                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fade-in { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) both; }
            `}} />
        </div>
    )
}
