import { useParams, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
    hoaHongImages, tulipImages, huongDuongImages, camTuCauImages,
    hoaCuoiImages, gioHoaImages, lanImages, valiHoaImages
} from "../assets/imageMap";

const getCategoryImages = (slug) => {
    switch (slug) {
        case 'hoa-hong': return { name: 'Hoa Hồng', images: Object.values(hoaHongImages) };
        case 'hoa-tulip': return { name: 'Hoa Tulip', images: Object.values(tulipImages) };
        case 'hoa-huong-duong': return { name: 'Hoa Hướng Dương', images: Object.values(huongDuongImages) };
        case 'hoa-cam-tu-cau': return { name: 'Hoa Cẩm Tú Cầu', images: Object.values(camTuCauImages) };
        case 'hoa-cuoi': return { name: 'Hoa Cưới', images: Object.values(hoaCuoiImages) };
        case 'gio-hoa': return { name: 'Giỏ Hoa', images: Object.values(gioHoaImages) };
        case 'hoa-lan': return { name: 'Hoa Lan', images: Object.values(lanImages) };
        case 'vali-hoa': return { name: 'Vali Hoa', images: Object.values(valiHoaImages) };
        default: return { name: 'Bộ Sưu Tập', images: [] };
    }
}

export default function GalleryPage() {
    const { slug } = useParams();
    const { name, images } = getCategoryImages(slug);

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link to="/" className="hover:text-pink-500">Trang chủ</Link>
                <ChevronRight size={14} />
                <span className="text-gray-700 font-medium truncate max-w-xs">{name}</span>
            </nav>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <h1 className="text-3xl font-bold font-playfair text-pink-700">Thư viện ảnh: {name}</h1>
                <Link
                    to={`/hoa?category=${slug}`}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-pink-600 text-white rounded-xl font-bold hover:bg-pink-700 transition shadow-sm w-fit"
                >
                    Xem tất cả sản phẩm {name}
                </Link>
            </div>

            {images.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    Chưa có hình ảnh nào trong thư mục này.
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {images.map((imgSrc, i) => (
                        <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-pink-50 shadow-sm hover:shadow-md transition">
                            <img
                                src={imgSrc}
                                alt={`${name} ${i + 1}`}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
