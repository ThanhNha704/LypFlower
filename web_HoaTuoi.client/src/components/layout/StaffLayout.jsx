import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { LogOut, Package } from "lucide-react";
import { Toaster } from "react-hot-toast";

export default function StaffLayout() {
    const { user, logout } = useAuthStore();

    // Nếu chưa đăng nhập hoặc không phải Staff
    if (!user || user.role !== "Staff") {
        return <Navigate to="/dang-nhap" replace />;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Toaster position="top-center" />
            
            {/* Header */}
            <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sticky top-0 z-50 shadow-sm">
                <div className="flex items-center gap-2">
                    <Package className="text-amber-500" size={20} />
                    <span className="font-bold text-gray-900">Flower Delivery</span>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-800">{user.fullName}</p>
                        <p className="text-[10px] text-gray-500">Nhân viên giao hàng</p>
                    </div>
                    <button 
                        onClick={logout}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        title="Đăng xuất"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
}
