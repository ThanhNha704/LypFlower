// src/pages/PolicyPage.jsx
import { useParams, Link, Navigate } from 'react-router-dom';
import { Truck, RotateCcw, ShieldCheck, MapPin } from 'lucide-react';

const policies = {
    'giao-hang': {
        title: 'Chính sách vận chuyển & Giao nhận',
        icon: Truck,
        content: (
            <div className="space-y-4">
                <h3 className="text-xl font-bold">1. Phương thức giao hàng</h3>
                <p>Sudes Craft hợp tác với các đơn vị vận chuyển uy tín (Giao Hàng Nhanh, Viettel Post,...) để đảm bảo sản phẩm được giao đến tận tay khách hàng một cách an toàn và nhanh chóng nhất.</p>
                <p>Phạm vi giao hàng: Toàn quốc.</p>

                <h3 className="text-xl font-bold mt-6">2. Phí vận chuyển</h3>
                <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Miễn phí vận chuyển:</strong> Áp dụng cho đơn hàng có giá trị thanh toán cuối cùng từ 500,000 VNĐ trở lên trên toàn quốc.</li>
                    <li><strong>Phí giao hàng linh hoạt:</strong> Đối với đơn dưới 500,000 VNĐ, phí giao hàng sẽ được tính theo bảng giá của đơn vị vận chuyển tại thời điểm đặt hàng.</li>
                </ul>

                <h3 className="text-xl font-bold mt-6">3. Thời gian giao hàng</h3>
                <p>Nội thành TP.HCM & Hà Nội: 1 - 2 ngày làm việc.</p>
                <p>Các tỉnh/thành phố khác: 3 - 5 ngày làm việc.</p>
                <p>Khu vực vùng sâu vùng xa/huyện/xã: 4 - 7 ngày làm việc.</p>
                <p className="italic text-sm text-stone-500">* Thời gian này không tính Chủ Nhật và các ngày Lễ/Tết.</p>
            </div>
        )
    },
    'doi-tra': {
        title: 'Chính sách đổi trả & Hoàn tiền',
        icon: RotateCcw,
        content: (
            <div className="space-y-4">
                <h3 className="text-xl font-bold">1. Điều kiện đổi trả</h3>
                <p>Chúng tôi chấp nhận đổi/trả sản phẩm trong vòng <strong>7 ngày</strong> kể từ ngày bạn nhận được hàng.</p>
                <ul className="list-disc pl-5 space-y-2">
                    <li>Sản phẩm còn nguyên trạng, chưa qua sử dụng, giặt ủi.</li>
                    <li>Tem mác, hóa đơn mua hàng còn nguyên vẹn/được giữ lại.</li>
                    <li>Lỗi sản phẩm thuộc về Sudes Craft (lỗi sản xuất, giao sai mẫu mã).</li>
                </ul>

                <h3 className="text-xl font-bold mt-6">2. Quy trình trả hàng</h3>
                <p>Quý khách vui lòng liên hệ hotline: <strong>0922 222 686</strong> hoặc gửi mail về <strong>support@hoatuoi.vn</strong> kèm theo hình ảnh rõ nét tình trạng sản phẩm và mã đơn hàng của bạn.</p>

                <h3 className="text-xl font-bold mt-6">3. Phương thức hoàn tiền</h3>
                <p>Trong trường hợp sản phẩm đủ điều kiện hoàn tiền, Sudes Craft sẽ thực hiện thanh toán chuyển khoản lại vào tài khoản khách hàng đã cung cấp trong thời gian 3 - 5 ngày làm việc tính từ lúc Sudes nhận lại được hàng hoàn trả.</p>
            </div>
        )
    },
    'bao-mat': {
        title: 'Chính sách bảo mật thông tin',
        icon: ShieldCheck,
        content: (
            <div className="space-y-4">
                <h3 className="text-xl font-bold">1. Mục đích thu thập thông tin</h3>
                <p>Lyp Flower thu thập thông tin cá nhân của Quý Khách khi đặt hàng trên website nhằm phục vụ cho các mục đích: giao hàng, hỗ trợ khách hàng, thực hiện khuyến mãi, cải thiện trải nghiệm mua sắm trên web.</p>

                <h3 className="text-xl font-bold mt-6">2. Phạm vi sử dụng thông tin</h3>
                <p>Chúng tôi cam kết sử dụng thông tin Quý Khách theo đúng chức năng và phạm vi phục vụ hoạt động mua sắm, giao dịch nội bộ tại công ty. Thông tin của Quý Khách (Tên, Số điện thoại, Địa chỉ nhận hàng, Email) có thể được chuyển giao cho các bên đối tác thứ 3 (đơn vị giao vận hàng hóa) để phục vụ cho công tác xử lý đơn.</p>

                <h3 className="text-xl font-bold mt-6">3. Cam kết bảo mật</h3>
                <p>Thông tin cá nhân của thành viên trên website cam kết bảo mật tuyệt đối. Việc thu thập và sử dụng thông tin của mỗi cá nhân/tổ chức chỉ được thực hiện khi có sự đồng ý của khách hàng đó trừ những trường hợp pháp luật có quy định khác.</p>
            </div>
        )
    },
    'huong-dan': {
        title: 'Hướng dẫn đặt hoa',
        icon: Truck,
        content: (
            <div className="space-y-4">
                <h3 className="text-xl font-bold">Các bước đặt hoa tại Lyp Flower</h3>
                <ol className="list-decimal pl-5 space-y-4">
                    <li>
                        <strong>Tìm kiếm sản phẩm:</strong> Bạn có thể tìm hoa theo danh mục (Hoa hồng, Tulip, Giỏ hoa...) hoặc tìm theo dịp tặng ngay trên thanh tìm kiếm.
                    </li>
                    <li>
                        <strong>Thêm vào giỏ hàng:</strong> Chọn mẫu hoa ưng ý, chọn số lượng và nhấn "Thêm vào giỏ hàng".
                    </li>
                    <li>
                        <strong>Kiểm tra giỏ hàng:</strong> Đi đến trang giỏ hàng để kiểm tra lại các sản phẩm đã chọn và số lượng.
                    </li>
                    <li>
                        <strong>Thanh toán:</strong> Nhập thông tin người mua, địa chỉ giao hàng và thông tin người nhận (nếu khác). Chọn phương thức thanh toán (VNPAY hoặc trả tiền khi nhận hàng).
                    </li>
                    <li>
                        <strong>Xác nhận đơn hàng:</strong> Sau khi thanh toán thành công, hệ thống sẽ gửi thông báo xác nhận và chúng tôi sẽ sớm liên hệ để giao hoa.
                    </li>
                </ol>
                <div className="bg-pink-50 p-4 rounded-xl mt-6">
                    <p className="font-bold text-pink-700">Lưu ý:</p>
                    <p className="text-pink-600 text-sm italic">Quý khách nên đặt trước 2-4 tiếng để florist có thời gian chuẩn bị hoa tươi nhất và giao hàng đúng hẹn.</p>
                </div>
            </div>
        )
    },
    'he-thong': {
        title: 'Hệ thống cửa hàng',
        icon: MapPin,
        content: (
            <div className="space-y-6">
                <p>Chào mừng bạn đến với hệ thống cửa hàng **Lyp Flower**. Hiện tại chúng tôi có các chi nhánh phục vụ tại TP. Hồ Chí Minh:</p>
                
                <div className="grid gap-6">
                    <div className="border border-pink-100 p-6 rounded-2xl bg-pink-50/30">
                        <h4 className="font-bold text-pink-700 text-lg mb-2">Chi nhánh Quận 12 (Flagship)</h4>
                        <p className="text-sm text-gray-600">📍 Địa chỉ: C2 Picity High Park, Phường Thới An, Quận 12, TP. HCM</p>
                        <p className="text-sm text-gray-600">📞 Hotline: 0922 222 686</p>
                        <p className="text-sm text-gray-600">⏰ Giờ mở cửa: 7:00 - 22:00 (Tất cả các ngày trong tuần)</p>
                    </div>
                </div>

                <p className="text-gray-500 italic text-sm">Chúng tôi đang tiếp tục mở rộng hệ thống để phục vụ quý khách tốt hơn. Rất hân hạnh được đón tiếp!</p>
            </div>
        )
    }
};

export default function PolicyPage() {
    const { type } = useParams();

    // If type is not provided or invalid, redirect to 'giao-hang'
    if (!type || !policies[type]) {
        return <Navigate to="/chinh-sach/giao-hang" replace />;
    }

    const currentPolicy = policies[type];
    const Icon = currentPolicy.icon;

    return (
        <div style={{ backgroundColor: 'var(--craft-cream)' }} className="min-h-screen pb-20 pt-16">

            {/* Header Banner */}
            <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
                <span className="inline-block text-xs font-bold uppercase tracking-widest text-amber-700 mb-2">Thông tin hỗ trợ</span>
                <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display',serif", color: 'var(--craft-brown)' }}>
                    {currentPolicy.title}
                </h1>
            </div>

            <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row gap-12 items-start">

                {/* Sidebar Nav */}
                <div className="w-full md:w-1/4 sticky top-24 shrink-0">
                    <h2 className="text-lg font-bold uppercase tracking-wide mb-4 text-stone-800 border-b pb-3" style={{ borderColor: 'var(--craft-tan)' }}>Chính sách</h2>
                    <nav className="flex flex-col gap-2">
                        {Object.keys(policies).map((key) => {
                            const navItem = policies[key];
                            const NavIcon = navItem.icon;
                            const isActive = type === key;

                            return (
                                <Link
                                    key={key}
                                    to={`/chinh-sach/${key}`}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm border
                    ${isActive
                                            ? 'bg-amber-50 text-amber-900 shadow-md'
                                            : 'bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900 border-transparent shadow-[#f5ede0] hover:shadow-sm'
                                        }`
                                    }
                                    style={{ borderColor: isActive ? 'var(--craft-tan)' : 'transparent' }}
                                >
                                    <NavIcon size={18} className={isActive ? 'text-amber-600' : 'text-stone-400'} />
                                    {navItem.title}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Content Area */}
                <div className="w-full md:w-3/4 flex-1">
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border" style={{ borderColor: 'var(--craft-tan)', color: 'var(--craft-brown)' }}>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-600">
                                <Icon size={24} />
                            </div>
                            <h2 className="text-3xl font-bold leading-none" style={{ fontFamily: "'Playfair Display',serif" }}>{currentPolicy.title}</h2>
                        </div>

                        <div className="prose prose-stone prose-p:leading-relaxed prose-h3:text-stone-800 prose-ul:text-stone-600 prose-p:text-stone-600">
                            {currentPolicy.content}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}
