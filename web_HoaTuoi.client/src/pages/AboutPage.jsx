import { ShieldCheck, Heart, Truck, Award, Star, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

export default function AboutPage() {
    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
                <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 transform hover:scale-105"
                    style={{ 
                        backgroundImage: "url('https://images.unsplash.com/photo-1519332978332-21b7d621d05e?q=80&w=2000&auto=format&fit=crop')",
                        filter: "brightness(0.6)"
                    }}
                ></div>
                <div className="relative text-center text-white px-4 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Lyp Flower
                    </h1>
                    <p className="text-lg md:text-xl font-medium text-pink-100 max-w-2xl mx-auto italic">
                        "Trao gửi yêu thương qua từng cánh hoa tươi"
                    </p>
                </div>
            </div>

            {/* Our Story Section */}
            <div className="max-w-7xl mx-auto px-4 py-20">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <div className="inline-block px-4 py-1.5 bg-pink-50 text-pink-600 rounded-full text-sm font-bold uppercase tracking-widest">
                            Câu chuyện thương hiệu
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Sứ mệnh mang lại niềm vui <br /> & Hạnh phúc cho mọi nhà
                        </h2>
                        <div className="space-y-4 text-gray-600 leading-relaxed">
                            <p>
                                Ra đời từ tình yêu nồng cháy với vẻ đẹp của thiên nhiên, **Lyp Flower** không chỉ đơn thuần là một cửa hàng bán hoa. Chúng tôi là nơi kết nối những tâm hồn, là cầu nối giúp bạn gửi gắm những tâm tư, tình cảm khó nói qua những bó hoa tươi thắm nhất.
                            </p>
                            <p>
                                Tại Lyp Flower, mỗi cành hoa đều được lựa chọn tỉ mỉ từ những nông trại hoa uy tín nhất tại Đà Lạt và các nguồn hoa nhập khẩu cao cấp. Chúng tôi tin rằng, một bó hoa đẹp không chỉ nằm ở hình thức mà còn ở tâm huyết của người nghệ nhân cắm hoa.
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <img 
                            src="https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1000&auto=format&fit=crop" 
                            alt="Flower Arrangement" 
                            className="rounded-3xl shadow-2xl relative z-10"
                        />
                        <div className="absolute -bottom-6 -right-6 w-64 h-64 bg-pink-100 rounded-3xl -z-0"></div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-gray-50 py-20">
                <div className="max-w-7xl mx-auto px-4 text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Tại sao chọn Lyp Flower?
                    </h2>
                </div>
                <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
                    {[
                        {
                            icon: Heart,
                            title: "Hoa Tươi Mỗi Ngày",
                            desc: "Cam kết 100% hoa tươi mới nhập về trong ngày, đảm bảo độ bền và hương thơm tự nhiên nhất."
                        },
                        {
                            icon: Truck,
                            title: "Giao Hàng Siêu Tốc",
                            desc: "Hệ thống giao hàng chuyên nghiệp, nhận cắm và giao hoa hỏa tốc trong vòng 2 giờ tại khu vực nội thành."
                        },
                        {
                            icon: ShieldCheck,
                            title: "Chất Lượng Đảm Bảo",
                            desc: "Hoàn tiền hoặc đổi sản phẩm mới nếu khách hàng không hài lòng về chất lượng hoa hoặc mẫu mã."
                        }
                    ].map((feature, idx) => (
                        <div key={idx} className="bg-white p-10 rounded-3xl shadow-sm hover:shadow-md transition-shadow text-center space-y-4 border border-gray-100">
                            <div className="w-16 h-16 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <feature.icon size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Values Section */}
            <div className="max-w-7xl mx-auto px-4 py-24">
                <div className="bg-pink-600 rounded-[3rem] p-12 md:p-20 text-white flex flex-col md:flex-row items-center gap-12 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="flex-1 space-y-6 relative z-10 text-center md:text-left">
                        <h2 className="text-3xl md:text-5xl font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
                            Gửi trọn tâm tình <br /> Qua từng mẫu hoa
                        </h2>
                        <p className="text-pink-100 text-lg max-w-lg">
                            Dù là sinh nhật, kỷ niệm, lễ cưới hay chỉ là một món quà bất ngờ, chúng tôi luôn có những mẫu hoa phù hợp để bạn bày tỏ cảm xúc.
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4 justify-center md:justify-start">
                            <Link to="/hoa" className="bg-white text-pink-600 px-8 py-4 rounded-full font-bold shadow-lg hover:bg-pink-50 transition transform hover:scale-105">
                                Khám phá các mẫu hoa
                            </Link>
                            <a href="tel:0922222686" className="border-2 border-white text-white px-8 py-4 rounded-full font-bold hover:bg-white/10 transition">
                                Hotline: 0922 222 686
                            </a>
                        </div>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4 relative z-10 w-full">
                        <div className="space-y-4">
                            <div className="h-40 bg-pink-100/20 rounded-2xl flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
                                <Award size={24} className="mb-2" />
                                <div className="text-3xl font-bold">10+</div>
                                <div className="text-xs font-medium text-pink-200">Năm Kinh Nghiệm</div>
                            </div>
                            <div className="h-40 bg-pink-100/20 rounded-2xl flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
                                <Star size={24} className="mb-2" />
                                <div className="text-3xl font-bold">4.9/5</div>
                                <div className="text-xs font-medium text-pink-200">Điểm Đánh Giá</div>
                            </div>
                        </div>
                        <div className="space-y-4 mt-8">
                            <div className="h-40 bg-pink-100/20 rounded-2xl flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
                                <Heart size={24} className="mb-2" />
                                <div className="text-3xl font-bold">50k+</div>
                                <div className="text-xs font-medium text-pink-200">Khách Hàng Hài Lòng</div>
                            </div>
                            <div className="h-40 bg-pink-100/20 rounded-2xl flex flex-col items-center justify-center text-center p-4 backdrop-blur-sm">
                                <Truck size={24} className="mb-2" />
                                <div className="text-3xl font-bold">100%</div>
                                <div className="text-xs font-medium text-pink-200">Giao Hàng An Toàn</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Final CTA */}
            <div className="bg-white py-20 border-t">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-400 mb-2 font-medium">Bạn cần hỗ trợ?</p>
                    <h3 className="text-2xl md:text-3xl font-bold mb-8 text-gray-900">Chúng tôi luôn sẵn sàng lắng nghe bạn</h3>
                    <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                        <div className="flex items-center gap-3 text-pink-600 font-bold text-xl">
                            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                                <Phone size={20} />
                            </div>
                            0922 222 686
                        </div>
                        <div className="flex items-center gap-3 text-pink-600 font-bold text-xl">
                            <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center">
                                <Mail size={20} />
                            </div>
                            hello@lypflower.vn
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
