import { NavLink, Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "../../store/authStore";
import {
    LayoutDashboard,
    Package,
    ShoppingBag,
    Tag,
    Star,
    FileText,
    LogOut,
    ChevronRight,
    Menu,
    Users,
    Ticket,
    Truck,
    Settings,
    BarChart3,
    Home,
    Bell,
    Bot,
    X,
    ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import { HubConnectionBuilder } from '@microsoft/signalr';
import toast from 'react-hot-toast';

const adminNav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/san-pham", label: "Sản phẩm hoa", icon: Package },
    { to: "/admin/danh-muc", label: "Danh mục", icon: Tag },
    { to: "/admin/don-hang", label: "Đơn hàng", icon: ShoppingBag },
    { to: "/admin/nguoi-dung", label: "Khách hàng", icon: Users },
    { to: "/admin/nhan-vien", label: "Nhân viên", icon: ShieldCheck },
    { to: "/admin/danh-gia", label: "Đánh giá", icon: Star },
    { to: "/admin/blog", label: "Tin tức & Blog", icon: FileText },
    { to: "/admin/khuyen-mai", label: "Khuyến mãi", icon: Ticket },
    { to: "/admin/ai-chat", label: "Quản lý Lyp AI", icon: Bot },
    { to: "/admin/cai-dat", label: "Cài đặt hệ thống", icon: Settings },
    { to: "/admin/bao-cao", label: "Báo cáo thống kê", icon: BarChart3 }
];

export default function AdminLayout() {
    const { user, logout } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setMobileOpen(false);
    }, [location]);
    
    // Notifications state
    const [notifications, setNotifications] = useState([]);
    const [showNotifs, setShowNotifs] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        if (!user || user.role !== "Admin") return;
        
        const connection = new HubConnectionBuilder()
            .withUrl(`${import.meta.env.VITE_API_URL ?? '/api'}`.replace(/\/api$/, '') + '/hubs/orders')
            .withAutomaticReconnect()
            .build();

        let isMounted = true;
        connection.start().catch(err => {
            // Ignore negotiation aborted errors in React StrictMode
            if (isMounted && !err.toString().includes('stopped during negotiation')) {
                console.error("SignalR Connection Error: ", err);
            }
        });

        connection.on("OrderCreated", (orderSummary) => {
            try {
                const audio = new Audio('/ting.mp3');
                audio.play().catch(()=>{});
            } catch (e) {}

            const newNotif = {
                id: Date.now(),
                title: "Đơn hàng mới!",
                message: `Khách vừa đặt đơn ${orderSummary.orderCode} trị giá ${orderSummary.finalAmount.toLocaleString('vi-VN')}đ`,
                time: new Date(),
                isRead: false
            };
            setNotifications(prev => [newNotif, ...prev]);
        });

        return () => {
            isMounted = false;
            connection.stop();
        };
    }, [user]);

    const markAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    if (!user || user.role !== "Admin") {
        return <Navigate to="/dang-nhap" replace />;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Toaster position="top-right" toastOptions={{ duration: 3000 }} />

            {/* Backdrop overlay for mobile */}
            {mobileOpen && (
                <div 
                    className="fixed inset-0 bg-black/40 z-40 md:hidden" 
                    onClick={() => setMobileOpen(false)} 
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 h-screen md:sticky md:top-0 ${
                    collapsed ? "md:w-16" : "md:w-60"
                } w-60 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
                    {!collapsed && (
                        <span className="font-bold text-gray-900">🌸 Flower Admin</span>
                    )}

                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="ml-auto p-1 rounded hover:bg-gray-100 hidden md:block"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
                    </button>

                    <button
                        onClick={() => setMobileOpen(false)}
                        className="ml-auto p-1 rounded hover:bg-gray-100 md:hidden text-gray-500"
                    >
                        <X size={18} />
                    </button>
                </div>

                <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
                    {adminNav.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isActive
                                        ? "bg-pink-100 text-pink-700"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                    }`
                                }
                            >
                                <Icon size={18} />
                                {!collapsed && <span>{item.label}</span>}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* Bottom Navigation */}
                <div className="p-2 border-t border-gray-100">
                    <Link
                        to="/"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Về trang chủ web"
                    >
                        <Home size={18} />
                        {!collapsed && <span>Về trang chủ web</span>}
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title="Mở menu"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-base font-semibold text-gray-800">
                            Quản trị Shop Hoa
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Notification Bell */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowNotifs(!showNotifs)}
                                className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <Bell size={20} />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Dropdown */}
                            {showNotifs && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                    <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                        <h3 className="font-bold text-gray-800">Thông báo</h3>
                                        {unreadCount > 0 && (
                                            <button onClick={markAllRead} className="text-xs text-blue-600 font-medium hover:underline">
                                                Đánh dấu đã đọc
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center text-gray-400 text-sm">
                                                Không có thông báo nào
                                            </div>
                                        ) : (
                                            <div className="divide-y divide-gray-50">
                                                {notifications.map(n => (
                                                    <div key={n.id} className={`p-4 transition-colors ${n.isRead ? 'bg-white' : 'bg-blue-50/30'}`}>
                                                        <div className="flex items-start gap-3">
                                                            <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900">{n.title}</p>
                                                                <p className="text-sm text-gray-600 mt-0.5">{n.message}</p>
                                                                <p className="text-xs text-gray-400 mt-1.5">{n.time.toLocaleTimeString('vi-VN')}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Profile + Logout */}
                        <div className="flex items-center gap-3 border-l pl-3 border-gray-100">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs font-bold text-gray-800">{user?.fullName}</p>
                                <p className="text-[10px] text-gray-400 font-medium">{user?.email}</p>
                            </div>
                            <button
                                onClick={logout}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors flex items-center justify-center"
                                title="Đăng xuất"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}