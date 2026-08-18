// src/components/product/FlowerCard.jsx
// Card sản phẩm cho web bán hoa tươi

import { Link } from 'react-router-dom';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { formatVnd } from '../../utils/format';
import { useCartStore } from '../../store/cartStore';
import { useWishlistStore } from '../../store/wishlistStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import { resolveImage } from '../../utils/imageResolver';
import RatingStars from '../common/RatingStars';

const FALLBACK_IMG = 'https://placehold.co/800x800/f8c8dc/333?text=Flower';

export default function ProductCard({ product }) {

    const {
        id,
        slug,
        name,
        mainImageUrl,
        price,
        salePrice,
        isOnSale,
        flowerType,
        color,
        occasion,
        averageRating,
        reviewCount,
        soldCount,
        isActive,
        stock
    } = product;

    const addItem = useCartStore(s => s.addItem);
    const wishlistIds = useWishlistStore(s => s.ids);
    const toggleWishlist = useWishlistStore(s => s.toggle);
    const { user } = useAuthStore();

    const isWishlisted = wishlistIds.includes(id);

    const imgSrc = resolveImage(mainImageUrl, FALLBACK_IMG);

    function handleAddCart(e) {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, 1);
    }

    async function handleToggleWishlist(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error("Vui lòng đăng nhập!");
            return;
        }

        try {
            const result = await toggleWishlist(id);
            toast.success(result.message);
        } catch {
            toast.error("Có lỗi xảy ra");
        }
    }

    const isDiscontinued = isActive === false;
    const isOutOfStock = stock === 0 && !isDiscontinued;

    return (
        <Link to={`/hoa/${slug}`} className={`group block text-center space-y-3 bg-white dark:bg-[#1a1a1a] p-2 rounded-2xl border dark:border-slate-800 transition-colors ${isDiscontinued ? 'opacity-70' : ''}`}>

            {/* Ảnh sản phẩm */}
            <div className="relative overflow-hidden rounded-2xl aspect-square bg-gray-50 dark:bg-gray-800 shadow-sm">
                <img
                    src={imgSrc}
                    alt={name}
                    loading="lazy"
                    className={`w-full h-full object-cover group-hover:scale-110 transition duration-700 ${isDiscontinued ? 'brightness-50' : isOutOfStock ? 'brightness-75' : ''}`}
                    onError={e => { e.currentTarget.src = FALLBACK_IMG }}
                />
                
                {isDiscontinued ? (
                    <div className="absolute top-2 left-2 bg-gray-600/90 backdrop-blur-[2px] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        Ngừng KD
                    </div>
                ) : isOutOfStock ? (
                    <div className="absolute top-2 left-2 bg-amber-600/90 backdrop-blur-[2px] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow">
                        Tạm hết hàng
                    </div>
                ) : null}

                <button 
                    onClick={handleToggleWishlist}
                    className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 dark:bg-black/50 backdrop-blur-[2px] shadow-sm flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 ${isWishlisted ? 'opacity-100 text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20' : 'text-gray-300 dark:text-gray-600 hover:text-pink-500 hover:bg-white dark:hover:bg-gray-700'}`}
                >
                    <Heart size={16} className={`transition-colors ${isWishlisted ? 'fill-current text-pink-500' : 'stroke-current'}`} />
                </button>
            </div>

            {/* Thông tin */}
            <div className="space-y-1.5 px-2">
                {/* Tên hoa */}
                <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[40px] flex items-center justify-center">
                    {name}
                </h3>

                {/* Giá */}
                <div className="text-sm font-bold text-[#E92E69] dark:text-pink-400">
                    {formatVnd(price)}
                </div>

                {/* Rating & Sold Count */}
                <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-bold">
                    <div className="flex items-center gap-1">
                        <RatingStars rating={averageRating || 5} size={11} color="#FFB800" />
                        <span className="text-gray-900 dark:text-gray-300">{(averageRating || 5).toFixed(1)}</span>
                    </div>
                    <span className="text-gray-200 dark:text-gray-700">|</span>
                    <span className="text-gray-400 dark:text-gray-500">Đã bán {soldCount ?? 0}</span>
                </div>

                {/* Nút đặt hàng */}
                <div className="pt-2">
                    {isDiscontinued ? (
                        <button
                            disabled
                            className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 text-[11px] font-bold rounded-lg cursor-not-allowed uppercase tracking-widest"
                        >
                            Ngừng KD
                        </button>
                    ) : isOutOfStock ? (
                        <button
                            disabled
                            className="w-full py-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 dark:text-amber-600 text-[11px] font-bold rounded-lg cursor-not-allowed uppercase tracking-widest"
                        >
                            Tạm hết hàng
                        </button>
                    ) : (
                        <button
                            onClick={handleAddCart}
                            className="w-full py-2 bg-[#E92E69] text-white text-[11px] font-bold rounded-lg hover:bg-pink-700 transition-all shadow-sm hover:shadow-md uppercase tracking-widest"
                        >
                            ĐẶT HÀNG
                        </button>
                    )}
                </div>
            </div>

        </Link>
    );
}