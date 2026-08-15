import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

export default function ContactPage() {
    function handleSubmit(e) {
        e.preventDefault();
        alert("Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.");
    }

    return (
        <div className="bg-white dark:bg-[#121212] transition-colors min-h-screen pb-20">
            {/* Header Banner */}
            <div className="bg-pink-50 dark:bg-pink-900/10 py-16 text-center">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Liên hệ với chúng tôi
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto italic">
                        "Lyp Flower luôn sẵn lòng lắng nghe và hỗ trợ bạn tìm được những đóa hoa tuyệt vời nhất."
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 -mt-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-lg border border-pink-100 dark:border-slate-800 flex items-start gap-4 transition-colors">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0">
                                <Phone size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Hotline hỗ trợ</h3>
                                <p className="text-pink-600 dark:text-pink-400 font-bold text-lg">0922 222 686</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hỗ trợ 24/7 cho mọi đơn hàng hỏa tốc.</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-lg border border-pink-100 dark:border-slate-800 flex items-start gap-4 transition-colors">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0">
                                <Mail size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Email liên hệ</h3>
                                <p className="text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">hello@lypflower.vn</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Phản hồi trong vòng 24 giờ làm việc.</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#1a1a1a] p-8 rounded-3xl shadow-lg border border-pink-100 dark:border-slate-800 flex items-start gap-4 transition-colors">
                            <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center shrink-0">
                                <Clock size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Giờ làm việc</h3>
                                <p className="text-gray-700 dark:text-gray-300 font-medium">07:00 - 22:00</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Tất cả các ngày trong tuần, kể cả Lễ/Tết.</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#1a1a1a] p-8 md:p-12 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-800 transition-colors">
                        <h2 className="text-2xl font-bold mb-8 text-gray-900 dark:text-gray-100">Gửi lời nhắn cho Lyp Flower</h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Họ và tên</label>
                                    <input required type="text" placeholder="Nguyễn Văn A" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Số điện thoại</label>
                                    <input required type="tel" placeholder="09xx xxx xxx" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Email</label>
                                <input required type="email" placeholder="example@gmail.com" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition" />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Chủ đề</label>
                                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition">
                                    <option>Tư vấn đặt hoa sinh nhật</option>
                                    <option>Khiếu nại dịch vụ/sản phẩm</option>
                                    <option>Hợp tác kinh doanh/Sự kiện</option>
                                    <option>Khác</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nội dung tin nhắn</label>
                                <textarea required rows={5} placeholder="Bạn cần chúng tôi hỗ trợ điều gì?" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-[#222] text-gray-900 dark:text-white focus:border-pink-500 focus:ring-2 focus:ring-pink-200 outline-none transition resize-none"></textarea>
                            </div>

                            <button type="submit" className="w-full md:w-auto px-10 py-4 bg-pink-600 text-white rounded-full font-bold hover:bg-pink-700 transition flex items-center justify-center gap-2 shadow-lg shadow-pink-200 dark:shadow-none">
                                <Send size={18} /> GỬI TIN NHẮN
                            </button>
                        </form>
                    </div>

                </div>

                {/* Store Location & Directions */}
                <div className="mt-16">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center shrink-0">
                                <MapPin size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg">Cửa hàng Lyp Flower</h3>
                                <p className="text-gray-600 text-sm">613 Âu Cơ, Tân Phú, Hồ Chí Minh 700000, Việt Nam</p>
                            </div>
                        </div>
                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=613+Au+Co,+Tan+Phu,+Ho+Chi+Minh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-full font-bold hover:bg-pink-700 transition shadow-lg shadow-pink-200 text-sm"
                        >
                            <MapPin size={16} />
                            Chỉ đường đến cửa hàng
                        </a>
                    </div>

                    {/* Google Maps Embed */}
                    <div className="rounded-[2rem] overflow-hidden shadow-xl border-8 border-white bg-gray-100 h-96 relative">
                        <iframe 
                            src="https://maps.google.com/maps?q=613%20%C3%82u%20C%C6%A1,%20T%C3%A2n%20Ph%C3%BA,%20H%E1%BB%93%20Ch%C3%AD%20Minh,%20Vi%E1%BB%87t%20Nam&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                            width="100%" 
                            height="100%" 
                            style={{ border: 0 }} 
                            allowFullScreen="" 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Bản đồ vị trí cửa hàng Lyp Flower"
                        ></iframe>

                        {/* Floating directions button on map */}
                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=613+Au+Co,+Tan+Phu,+Ho+Chi+Minh"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-5 py-3 bg-white text-pink-600 rounded-full font-bold hover:bg-pink-50 transition shadow-xl border border-pink-200 text-sm z-10"
                            title="Mở Google Maps để chỉ đường"
                        >
                            <MapPin size={16} />
                            Chỉ đường
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
