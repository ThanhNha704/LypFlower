import { useAuthStore } from "../../store/authStore";
import { Package, Truck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import apiClient from "../../api/client";

export default function StaffDashboard() {
    const { user } = useAuthStore();
    const [stats, setStats] = useState({ pending: 0, completed: 0 });

    useEffect(() => {
        // Lấy danh sách đơn để đếm
        apiClient.get('/orders/staff')
            .then(res => {
                const orders = res.data.items || [];
                const pending = orders.filter(o => o.status === 'Processing' || o.status === 'Shipping').length;
                const completed = orders.filter(o => o.status === 'Completed').length;
                setStats({ pending, completed });
            })
            .catch(() => {});
    }, []);

    return (
        <div className="p-6 max-w-lg mx-auto min-h-[calc(100vh-56px)] flex flex-col justify-center">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-amber-100 text-center space-y-6">
                <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Truck size={40} strokeWidth={1.5} />
                </div>
                
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.fullName}!</h1>
                    <p className="text-gray-500 mt-2 text-sm">Chào mừng bạn đến với hệ thống giao hàng Lyp Flower. Chúc bạn một ngày làm việc hiệu quả.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-200">
                    <div>
                        <p className="text-3xl font-black text-amber-500">{stats.pending}</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Đơn cần giao</p>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-green-500">{stats.completed}</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-1">Đã giao xong</p>
                    </div>
                </div>

                <Link 
                    to="/nhan-vien/don-hang"
                    className="flex items-center justify-center gap-2 w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30 active:scale-95"
                >
                    <Package size={20} />
                    Vào trang nhận đơn & Giao hàng
                    <ArrowRight size={18} />
                </Link>
            </div>
        </div>
    );
}
