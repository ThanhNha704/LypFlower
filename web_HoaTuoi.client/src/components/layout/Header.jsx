import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
    ShoppingCart,
    Heart,
    Search,
    Menu,
    X,
    LogOut,
    ChevronDown,
    Phone,
    Moon,
    Sun
} from "lucide-react";

import { useThemeStore } from "../../store/themeStore";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { useWishlistStore } from "../../store/wishlistStore";
import { useCategoriesStore } from "../../store/categoriesStore";
import toast from "react-hot-toast";

const navLinks = [
    { to: "/", label: "Trang chủ" },
    { to: "/hoa", label: "Bộ sưu tập", hasDropdown: true },
    { to: "/blog", label: "Tin tức" },
    { to: "/lien-he", label: "Liên hệ" }
];

export default function Header() {

    const [menuOpen, setMenuOpen] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchVal, setSearchVal] = useState("");

    const navigate = useNavigate();

    const items = useCartStore(s => s.items);
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);

    const { theme, toggleTheme } = useThemeStore();
    const { user, logout } = useAuthStore();

    const wishlistIds = useWishlistStore(s => s.ids);
    const fetchWishlistIfNeeded = useWishlistStore(s => s.fetchIfNeeded);
    const resetWishlist = useWishlistStore(s => s.reset);

    const { categories, flowerTypes, occasions, fetchIfEmpty } = useCategoriesStore();

    useEffect(() => {
        fetchIfEmpty();
    }, [fetchIfEmpty]);

    useEffect(() => {
        if (user) {
            fetchWishlistIfNeeded();
        } else {
            resetWishlist();
        }
    }, [user, fetchWishlistIfNeeded, resetWishlist]);

    const quickCategories = categories.slice(0, 5);

    function handleSearch(e) {
        e.preventDefault();

        if (searchVal.trim()) {
            navigate(`/hoa?q=${encodeURIComponent(searchVal.trim())}`);
            setSearchOpen(false);
            setSearchVal("");
        }
    }

    return (
        <>
            {/* Top Bar */}
            <div className="bg-[#E92E69] text-white py-1.5 text-xs hidden md:block transition-colors">
                <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5">
                            <Phone size={12} />
                            Hotline: <strong className="text-sm">0922 222 686</strong>
                        </span>
                        <span className="opacity-80">· Giao hoa nhanh trong ngày</span>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/lien-he" className="hover:opacity-80">Liên hệ</Link>
                        <Link to="/blog" className="hover:opacity-80">Tin tức</Link>
                    </div>
                </div>
            </div>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white dark:bg-[#121212] shadow-sm border-b dark:border-slate-800 transition-colors">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-4">

                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2 mr-4 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-pink-500 text-white flex items-center justify-center text-lg">
                            🌸
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-xl text-pink-600 dark:text-pink-400 leading-none">Lyp Flower</h1>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-widest">Fresh Flower Store</span>
                        </div>
                    </Link>

                    {/* Menu */}
                    <nav className="hidden lg:flex flex-1 items-center gap-2">
                        {navLinks.map(l => (
                            <div key={l.to} className="relative group">

                                <NavLink
                                    to={l.to}
                                    end={l.to === "/"}
                                    className={({ isActive }) =>
                                        `px-4 py-2 text-sm rounded-lg flex items-center gap-1 font-medium transition-colors ${isActive
                                            ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                                            : "text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 hover:text-pink-600 dark:hover:text-pink-400"
                                        }`
                                    }
                                >
                                    {l.label}
                                    {l.hasDropdown && <ChevronDown size={14} />}
                                </NavLink>

                                {l.hasDropdown && (
                                    <div className="absolute left-[0px] top-full w-[500px] bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl border dark:border-slate-800 p-6 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition grid grid-cols-2 gap-6">

                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-100 dark:border-slate-800 pb-2">Danh mục hoa</h4>
                                            <div className="flex flex-col space-y-1">
                                                {categories.filter(c => c.productCount > 0).slice(0, 8).map(cat => (
                                                    <Link
                                                        key={cat.slug}
                                                        to={`/hoa?category=${cat.slug}`}
                                                        className="px-2 py-1.5 text-[13px] text-gray-600 dark:text-gray-300 rounded hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                                                    >
                                                        {cat.name}
                                                    </Link>
                                                ))}
                                                <Link to="/hoa" className="px-2 py-1.5 text-[13px] text-pink-600 font-semibold mt-1">Xem tất cả &rarr;</Link>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-100 dark:border-slate-800 pb-2">Loài hoa</h4>
                                            <div className="flex flex-col space-y-1">
                                                {flowerTypes.slice(0, 8).map(f => (
                                                    <Link
                                                        key={f}
                                                        to={`/hoa?flowerType=${encodeURIComponent(f)}`}
                                                        className="px-2 py-1.5 text-[13px] text-gray-600 dark:text-gray-300 rounded hover:bg-pink-50 dark:hover:bg-pink-950/20 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                                                    >
                                                        {f}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>



                                    </div>
                                )}

                            </div>
                        ))}
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-auto">

                        <button
                            onClick={toggleTheme}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>

                        <button
                            onClick={() => setSearchOpen(v => !v)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-600 dark:text-gray-300 transition-colors"
                        >
                            <Search size={18} />
                        </button>

                        <Link to="/wishlist" className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <Heart size={18} />
                            {wishlistIds.length > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                    {wishlistIds.length}
                                </span>
                            )}
                        </Link>

                        <Link to="/gio-hang" className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <ShoppingCart size={18} />
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="relative group">
                                <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 p-1 pr-3 rounded-full transition">
                                    <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 dark:text-pink-400 font-bold border border-pink-200 dark:border-pink-800 uppercase">
                                        {user.fullName?.[0] || 'U'}
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 hidden sm:flex items-center gap-1">
                                        {user.fullName?.split(' ').pop()}
                                        <ChevronDown size={14} className="text-gray-400 group-hover:text-pink-500 transition-colors" />
                                    </span>
                                </div>

                                {/* Dropdown Menu */}
                                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-pink-50 dark:border-slate-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform origin-top-right group-hover:translate-y-0 translate-y-2 z-50">
                                    <div className="p-4 border-b border-gray-50 dark:border-slate-800 flex flex-col items-center text-center">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white text-xl font-bold uppercase mb-2 shadow-inner">
                                            {user.fullName?.[0] || 'U'}
                                        </div>
                                        <p className="font-bold text-gray-800 dark:text-gray-200 line-clamp-1">{user.fullName}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{user.email}</p>
                                        <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${user.role === 'Admin' ? 'bg-amber-100 text-amber-700' : user.role === 'Staff' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'}`}>
                                            {user.role === 'Admin' ? 'Quản trị viên' : user.role === 'Staff' ? 'Nhân viên' : 'Khách hàng'}
                                        </span>
                                    </div>

                                    <div className="p-2 space-y-0.5">
                                        {user.role === 'Admin' ? (
                                            <>
                                                <Link to="/admin" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Bảng điều khiển</Link>
                                                <Link to="/admin/don-hang" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Quản lý Đơn hàng</Link>
                                                <Link to="/admin/san-pham" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Quản lý Sản phẩm</Link>
                                            </>
                                        ) : user.role === 'Staff' ? (
                                            <>
                                                <Link to="/nhan-vien" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Bảng điều khiển</Link>
                                                <Link to="/nhan-vien/don-hang" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Giao hàng</Link>
                                            </>
                                        ) : (
                                            <>
                                                <Link to="/tai-khoan" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Tài khoản của tôi</Link>
                                                <Link to="/don-hang" className="block px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-slate-800 rounded-lg hover:text-pink-600 dark:hover:text-pink-400 transition-colors">Đơn hàng của tôi</Link>
                                            </>
                                        )}
                                    </div>

                                    <div className="p-2 border-t border-gray-50 dark:border-slate-800">
                                        <button
                                            onClick={() => {
                                                logout();
                                                toast.success("Đã đăng xuất thành công");
                                                navigate('/');
                                            }}
                                            className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2 transition-colors font-medium"
                                        >
                                            <LogOut size={16} /> Đăng xuất
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <Link
                                to="/dang-nhap"
                                className="text-sm border-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:text-white font-semibold px-4 py-1.5 rounded-full transition-all"
                            >
                                Đăng nhập
                            </Link>
                        )}

                        <button
                            className="lg:hidden p-2 text-gray-600 dark:text-gray-300"
                            onClick={() => setMenuOpen(v => !v)}
                        >
                            {menuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                    </div>
                </div>

                {/* Search */}
                {searchOpen && (
                    <div className="border-t dark:border-slate-800 p-3 bg-white dark:bg-[#121212]">
                        <form onSubmit={handleSearch} className="max-w-lg mx-auto flex gap-2">

                            <input
                                value={searchVal}
                                onChange={e => setSearchVal(e.target.value)}
                                placeholder="Tìm hoa sinh nhật, hoa khai trương..."
                                className="flex-1 border dark:border-slate-800 rounded px-3 py-2 text-sm dark:bg-[#1a1a1a] dark:text-white"
                            />

                            <button className="bg-pink-500 text-white px-4 rounded text-sm">
                                Tìm
                            </button>

                        </form>
                    </div>
                )}

                {/* Mobile Menu */}
                {menuOpen && (
                    <div className="lg:hidden absolute top-full left-0 w-full bg-white dark:bg-[#1a1a1a] border-t dark:border-slate-800 shadow-lg z-50">
                        <nav className="flex flex-col max-h-[80vh] overflow-y-auto">
                            {navLinks.map(l => (
                                <div key={l.to}>
                                    <NavLink
                                        to={l.to}
                                        onClick={() => setMenuOpen(false)}
                                        className={({ isActive }) =>
                                            `block px-6 py-4 font-medium border-b border-gray-50 dark:border-slate-800 ${isActive ? "text-pink-600 bg-pink-50 dark:bg-pink-900/30 dark:text-pink-400" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-pink-600 dark:hover:text-pink-400"}`
                                        }
                                    >
                                        <div className="flex items-center justify-between">
                                            <span>{l.label}</span>
                                            {l.hasDropdown && <ChevronDown size={16} />}
                                        </div>
                                    </NavLink>
                                    
                                    {/* Mobile Submenu */}
                                    {l.hasDropdown && categories.length > 0 && (
                                        <div className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-50 dark:border-slate-800 max-h-64 overflow-y-auto">
                                            {categories.map(cat => (
                                                <Link
                                                    key={cat.slug}
                                                    to={`/hoa?category=${cat.slug}`}
                                                    onClick={() => setMenuOpen(false)}
                                                    className="block px-8 py-3 text-sm text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 hover:bg-pink-50/50 dark:hover:bg-pink-900/20 transition-colors"
                                                >
                                                    🌸 {cat.name}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>
                    </div>
                )}

            </header>
        </>
    );
}