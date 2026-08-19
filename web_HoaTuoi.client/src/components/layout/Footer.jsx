import { Link } from "react-router-dom";
import { MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";

const socialLinks = [
    { icon: Facebook, href: "#" },
    { icon: Instagram, href: "#" },
];

const supportLinks = [
    { to: "/chinh-sach/huong-dan", label: "Hướng dẫn đặt hoa" },
    { to: "/chinh-sach/doi-tra", label: "Chính sách đổi trả" },
    { to: "/chinh-sach/giao-hang", label: "Chính sách giao hàng" },
    { to: "/don-hang", label: "Tra cứu đơn hàng" },
    { to: "/lien-he", label: "Liên hệ" }
];

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300">

            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

                {/* Brand */}
                <div className="space-y-4">
                    <h3 className="text-white font-bold text-lg">🌸 Lyp Flower</h3>

                    <p className="text-sm text-gray-400">
                        Lyp Flower chuyên cung cấp hoa tươi cho các dịp sinh nhật,
                        khai trương, kỷ niệm và sự kiện. Cam kết hoa tươi đẹp,
                        giao nhanh trong ngày.
                    </p>

                    <div className="space-y-2 text-sm">
                        <a
                            href="https://www.google.com/maps/dir/?api=1&destination=10.8668069,106.6652027"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 hover:text-pink-400 transition-colors cursor-pointer"
                            title="Bấm để chỉ đường đến cửa hàng"
                        >
                            <MapPin size={14} />
                            <span>Khu dân cư PiCity High Park, Q.12, TP. HCM</span>
                        </a>

                        <div className="flex items-center gap-2">
                            <Phone size={14} />
                            <span>0922 222 686</span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Mail size={14} />
                            <span>flowershop@gmail.com</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        {socialLinks.map((item, index) => {
                            const Icon = item.icon;

                            return (
                                <a
                                    key={index}
                                    href={item.href}
                                    className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-pink-500 transition"
                                >
                                    <Icon size={16} />
                                </a>
                            );
                        })}
                    </div>
                </div>

                {/* About */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Về chúng tôi</h4>
                    <ul className="space-y-2 text-sm">
                        <li>
                            <Link to="/gioi-thieu" className="hover:text-pink-400">
                                Giới thiệu
                            </Link>
                        </li>

                        <li>
                            <Link to="/chinh-sach/he-thong" className="hover:text-pink-400">
                                Hệ thống cửa hàng
                            </Link>
                        </li>

                        <li>
                            <Link to="/blog" className="hover:text-pink-400">
                                Blog hoa
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Support */}
                <div>
                    <h4 className="text-white font-semibold mb-4">Hỗ trợ</h4>
                    <ul className="space-y-2 text-sm">
                        {supportLinks.map((l) => (
                            <li key={l.label}>
                                <Link to={l.to} className="hover:text-pink-400">
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>


            </div>

            {/* Bottom */}
            <div className="border-t border-gray-800 py-4 text-center text-xs text-gray-500">
                © 2026 Lyp Flower - Web bán hoa tươi
            </div>
        </footer>
    );
}