import { MapPin, Phone, Mail, Clock, MessageSquare, Facebook, Send } from "lucide-react";

export default function ContactPage() {
    return (
        <div className="bg-white dark:bg-[#121212] transition-colors min-h-screen pb-20">
            {/* Header Banner */}
            <div className="bg-pink-50 dark:bg-pink-900/10 py-20 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#db2777_1px,transparent_1px)] [background-size:16px_16px]"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-widest bg-pink-100/50 dark:bg-pink-900/20 px-3.5 py-1.5 rounded-full">
                        Liên hệ & Hỗ trợ
                    </span>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-gray-100 mt-4 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Kết nối với Lyp Flower
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto italic text-sm md:text-base">
                        "Lyp Flower luôn sẵn lòng lắng nghe, hỗ trợ bạn trao gửi yêu thương và tìm được những đóa hoa tươi đẹp, ý nghĩa nhất."
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Hotline Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-lg border border-pink-100 dark:border-slate-800/60 flex items-start gap-4 transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                        <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                            <Phone size={26} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Tổng đài hỗ trợ</span>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mt-0.5 mb-1">Hotline Đặt Hoa</h3>
                            <a href="tel:0922222686" className="text-pink-600 dark:text-pink-400 font-black text-xl hover:underline block">0922 222 686</a>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Hỗ trợ tư vấn thiết kế mẫu hoa 24/7 và giao hàng hoả tốc tận nơi trong 2 giờ.</p>
                        </div>
                    </div>

                    {/* Email Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-lg border border-pink-100 dark:border-slate-800/60 flex items-start gap-4 transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                        <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                            <Mail size={26} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Hợp tác & khiếu nại</span>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mt-0.5 mb-1">Email Liên Hệ</h3>
                            <a href="mailto:hello@lypflower.vn" className="text-gray-800 dark:text-gray-200 font-bold hover:underline block text-base truncate">hello@lypflower.vn</a>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Tiếp nhận phản hồi dịch vụ, khiếu nại đơn hàng và đề xuất hợp tác sự kiện doanh nghiệp.</p>
                        </div>
                    </div>

                    {/* Clock Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-lg border border-pink-100 dark:border-slate-800/60 flex items-start gap-4 transition-all hover:shadow-xl hover:-translate-y-1 duration-300">
                        <div className="w-14 h-14 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                            <Clock size={26} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-pink-500 uppercase tracking-wider">Khung giờ hoạt động</span>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mt-0.5 mb-1">Giờ Mở Cửa</h3>
                            <p className="text-gray-800 dark:text-gray-200 font-bold text-base">07:00 - 22:00</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">Mở cửa tất cả các ngày trong tuần (Kể cả Lễ, Tết và ngày nghỉ cuối tuần) để phục vụ quý khách.</p>
                        </div>
                    </div>
                </div>

                {/* Online Support & Info Systems */}
                <div className="grid lg:grid-cols-5 gap-8 mt-12">
                    {/* Left Column: Social Links / Support Channel */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-pink-500 to-rose-600 text-white p-8 rounded-3xl shadow-xl space-y-6 flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>Hỗ trợ trực tuyến</h2>
                            <p className="text-sm text-pink-50/90 leading-relaxed">
                                Quý khách cần đặt hoa thiết kế riêng hoặc giao gấp? Vui lòng kết nối trực tiếp với nhân viên tư vấn qua các kênh chat trực tuyến để được phản hồi ngay lập tức.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <a 
                                href="https://zalo.me/0922222686" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center justify-center gap-3 w-full py-3.5 bg-white text-pink-600 hover:bg-pink-50 font-bold rounded-2xl transition-all shadow-md active:scale-95 text-sm"
                            >
                                <MessageSquare size={18} /> Chat qua Zalo Hỗ Trợ
                            </a>
                            <a 
                                href="https://facebook.com" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="flex items-center justify-center gap-3 w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/20 active:scale-95 text-sm"
                            >
                                <Facebook size={18} /> Kết nối Fanpage Facebook
                            </a>
                        </div>

                        <div className="pt-4 border-t border-white/20 text-center">
                            <p className="text-[10px] text-pink-100 font-medium">Lyp Flower - Trao Gửi Yêu Thương Qua Từng Đóa Hoa</p>
                        </div>
                    </div>

                    {/* Right Column: Store Introduction & Philosophy */}
                    <div className="lg:col-span-3 bg-white dark:bg-[#1a1a1a] p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800/60 transition-colors flex flex-col justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                                Về Cửa Hàng Lyp Flower
                            </h2>
                            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                                <p>
                                    Nằm ngay khu dân cư hiện đại PiCity High Park, Lyp Flower tự hào là một trong những địa chỉ hoa tươi uy tín, mang phong cách hiện đại và tinh tế hàng đầu tại khu vực Quận 12, TP. Hồ Chí Minh.
                                </p>
                                <p>
                                    Chúng tôi sở hữu đa dạng các dòng hoa cao cấp nhập khẩu từ Ecuador, Hà Lan, Nhật Bản,... kết hợp cùng các dòng hoa cao sản Đà Lạt chọn lọc chất lượng cao nhất. Mỗi sản phẩm được hoàn thiện tỉ mỉ bởi những florist lành nghề, đầy đam mê sáng tạo.
                                </p>
                                <p className="font-medium text-pink-600 dark:text-pink-400 italic">
                                    "Chúng tôi không chỉ bán hoa, chúng tôi thiết kế và gửi gắm những thông điệp cảm xúc tuyệt vời nhất của bạn đến người nhận."
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100 dark:border-slate-800/65 mt-6 text-center">
                            <div>
                                <p className="text-xl md:text-2xl font-black text-pink-600 dark:text-pink-400">100%</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Hoa Tươi Mỗi Ngày</p>
                            </div>
                            <div>
                                <p className="text-xl md:text-2xl font-black text-pink-600 dark:text-pink-400">2 Giờ</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Giao Hỏa Tốc</p>
                            </div>
                            <div>
                                <p className="text-xl md:text-2xl font-black text-pink-600 dark:text-pink-400">10K+</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Khách Hài Lòng</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Store Location & Directions */}
                <div className="mt-16 bg-white dark:bg-[#1a1a1a] rounded-3xl p-6 md:p-8 shadow-xl border border-gray-100 dark:border-slate-800/60">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Cửa hàng Lyp Flower</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">Khu dân cư PiCity High Park, Thạnh Xuân 13, Phường Thạnh Xuân, Quận 12, TP. Hồ Chí Minh</p>
                            </div>
                        </div>
                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=10.8668069,106.6652027"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-bold transition shadow-lg shadow-pink-200 dark:shadow-none text-sm active:scale-95 shrink-0"
                        >
                            <MapPin size={16} />
                            Chỉ đường trên Google Maps
                        </a>
                    </div>

                    {/* Google Maps Embed */}
                    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-gray-150 shadow-inner">
                        <iframe 
                            src="https://maps.google.com/maps?q=10.8668069,106.6652027&t=&z=16&ie=UTF8&iwloc=&output=embed" 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0 }} 
                            allowFullScreen="" 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Lyp Flower Location Map"
                        ></iframe>
                    </div>
                </div>

            </div>
        </div>
    );
}
