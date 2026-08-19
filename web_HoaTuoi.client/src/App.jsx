import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useThemeStore } from './store/themeStore'

import CustomerLayout from './components/layout/CustomerLayout'
import AdminLayout from './components/layout/AdminLayout'
import StaffLayout from './components/layout/StaffLayout'
import ScrollToTop from './components/common/ScrollToTop'

import HomePage from './pages/HomePage'
import SemanticSearch from './pages/SemanticSearch'
import ProductListPage from './pages/ProductListPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import WishlistPage from './pages/WishlistPage'
import VnPayReturnPage from './pages/VnPayReturnPage'
import BlogPage from './pages/BlogPage'
import BlogDetailPage from './pages/BlogDetailPage'
import PolicyPage from './pages/PolicyPage'
import GalleryPage from './pages/GalleryPage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminReviews from './pages/admin/AdminReviews'
import AdminBlog from './pages/admin/AdminBlog'
import AdminUsers from './pages/admin/AdminUsers'
import AdminVouchers from './pages/admin/AdminVouchers'
import AdminShipping from './pages/admin/AdminShipping'
import AdminSettings from './pages/admin/AdminSettings'
import AdminReports from './pages/admin/AdminReports'

import StaffOrders from './pages/staff/StaffOrders'
import StaffDashboard from './pages/staff/StaffDashboard'

import AdminAiChat from './pages/admin/AdminAiChat'



export default function App() {
    const initTheme = useThemeStore((s) => s.initTheme)

    useEffect(() => {
        initTheme()
    }, [initTheme])

    return (
        <>
            <BrowserRouter>
                <ScrollToTop />

                <Routes>

                    {/* Nhóm tuyến đường (Routes) dành cho giao diện Khách hàng */}
                    <Route element={<CustomerLayout />}>

                        <Route path="/" element={<HomePage />} />

                        <Route path="/semantic-search" element={<SemanticSearch />} />

                        <Route path="/hoa" element={<ProductListPage />} />

                        <Route path="/hoa/:slug" element={<ProductDetailPage />} />

                        <Route path="/gio-hang" element={<CartPage />} />

                        <Route path="/thanh-toan" element={<CheckoutPage />} />

                        <Route path="/wishlist" element={<WishlistPage />} />

                        <Route path="/blog" element={<BlogPage />} />

                        <Route path="/blog/:slug" element={<BlogDetailPage />} />

                        <Route path="/bo-hoa" element={<ProductListPage />} />

                        <Route path="/chinh-sach" element={<PolicyPage />} />

                        <Route path="/chinh-sach/:type" element={<PolicyPage />} />

                        <Route path="/gallery/:slug" element={<GalleryPage />} />

                        <Route path="/tai-khoan" element={<ProfilePage />} />

                        <Route path="/don-hang" element={<OrdersPage />} />

                        <Route path="/gioi-thieu" element={<AboutPage />} />

                        <Route path="/lien-he" element={<ContactPage />} />

                    </Route>

                    {/* Nhóm tuyến đường Đăng nhập và Khôi phục mật khẩu */}
                    <Route path="/dang-nhap" element={<LoginPage />} />
                    <Route path="/dang-ky" element={<LoginPage />} />
                    <Route path="/quen-mat-khau" element={<ForgotPasswordPage />} />
                    <Route path="/dat-lai-mat-khau" element={<ResetPasswordPage />} />

                    {/* Tuyến đường xử lý phản hồi kết quả từ cổng thanh toán VNPay */}
                    <Route path="/checkout/vnpay-return" element={<VnPayReturnPage />} />

                    {/* Nhóm tuyến đường dành cho giao diện Quản lý (Admin) */}
                    <Route path="/admin" element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="san-pham" element={<AdminProducts />} />
                        <Route path="danh-muc" element={<AdminCategories />} />
                        <Route path="don-hang" element={<AdminOrders />} />
                        <Route path="nguoi-dung" element={<AdminUsers />} />
                        <Route path="danh-gia" element={<AdminReviews />} />
                        <Route path="blog" element={<AdminBlog />} />
                        <Route path="khuyen-mai" element={<AdminVouchers />} />
                        <Route path="van-chuyen" element={<AdminShipping />} />
                        <Route path="ai-chat" element={<AdminAiChat />} />
                        <Route path="cai-dat" element={<AdminSettings />} />
                        <Route path="bao-cao" element={<AdminReports />} />
                    </Route>

                    {/* Nhóm tuyến đường dành cho giao diện Nhân viên giao hàng (Staff) */}
                    <Route path="/nhan-vien" element={<StaffLayout />}>
                        <Route index element={<StaffDashboard />} />
                        <Route path="don-hang" element={<StaffOrders />} />
                    </Route>

                    {/* Tuyến đường mặc định chuyển hướng khi URL không khớp (Fallback) */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>

            </BrowserRouter>
        </>
    )
}