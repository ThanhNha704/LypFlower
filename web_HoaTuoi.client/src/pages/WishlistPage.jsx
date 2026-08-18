// src/pages/WishlistPage.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowLeft, HeartOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useWishlistStore } from '../store/wishlistStore';
import { wishlistApi } from '../api/wishlist';
import { formatVnd } from '../utils/format';
import { resolveImage } from '../utils/imageResolver';
import toast from 'react-hot-toast';

const FALLBACK_IMG = 'https://placehold.co/400x400/d4a574/fff?text=No+Image';

export default function WishlistPage() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const addItem = useCartStore(s => s.addItem);
    const { remove: removeFromStore } = useWishlistStore();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState(null);

    useEffect(() => {
        if (!user) {
            navigate('/dang-nhap', { replace: true });
            return;
        }
        fetchWishlist();
    }, [user]);

    async function fetchWishlist() {
        try {
            setLoading(true);
            const data = await wishlistApi.getWishlist();
            setItems(data || []);
        } catch (err) {
            toast.error('Không thể tải danh sách yêu thích.');
        } finally {
            setLoading(false);
        }
    }

    async function handleRemove(productId) {
        try {
            setRemovingId(productId);
            await removeFromStore(productId);
            setItems(prev => prev.filter(i => i.productId !== productId));
            toast.success('Đã xóa khỏi yêu thích!');
        } catch {
            toast.error('Có lỗi xảy ra.');
        } finally {
            setRemovingId(null);
        }
    }

    function handleAddToCart(item) {
        addItem({
            id: item.productId,
            name: item.productName,
            mainImageUrl: resolveImage(item.mainImageUrl),
            price: item.price,
            salePrice: item.salePrice,
        }, 1);
        toast.success(`Đã thêm "${item.productName}" vào giỏ hàng!`);
    }

    // ── Loading skeleton ──
    if (loading) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-10">
                <div className="h-8 w-64 skeleton mb-8" />
                <div className="grid gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-28 skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    // ── Empty state ──
    if (items.length === 0) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-20 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'var(--craft-beige)' }}>
                    <HeartOff size={40} style={{ color: 'var(--craft-muted)' }} />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--craft-brown)' }}>
                    Danh sách yêu thích trống
                </h1>
                <p className="text-sm mb-6" style={{ color: 'var(--craft-muted)' }}>
                    Hãy khám phá và thêm các sản phẩm bạn yêu thích vào danh sách nhé!
                </p>
                <Link to="/hoa" className="btn-primary">
                    Khám phá sản phẩm
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="p-2 rounded-full hover:bg-amber-50 transition-colors"
                        style={{ color: 'var(--craft-muted)' }}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: 'var(--craft-brown)' }}>
                            Danh sách yêu thích
                        </h1>
                        <p className="text-sm mt-0.5" style={{ color: 'var(--craft-muted)' }}>
                            {items.length} sản phẩm
                        </p>
                    </div>
                </div>
                <Heart size={24} className="fill-red-500 text-red-500" />
            </div>

            {/* List */}
            <div className="space-y-4">
                {items.map((item, index) => {
                    const imgSrc = resolveImage(item.mainImageUrl) || FALLBACK_IMG;
                    const isRemoving = removingId === item.productId;

                    return (
                        <div key={item.id}
                            className="animate-fadeInUp"
                            style={{
                                animationDelay: `${index * 0.05}s`,
                                opacity: isRemoving ? 0.5 : 1,
                                transition: 'opacity 0.3s',
                            }}>
                            <div className="bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
                                style={{ border: '1px solid var(--craft-tan)' }}>
                                <div className="flex items-center gap-4 p-4">
                                    {/* Ảnh sản phẩm */}
                                    <Link to={`/hoa/${item.slug}`}
                                        className="flex-shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden"
                                        style={{ backgroundColor: 'var(--craft-beige)' }}>
                                        <img src={imgSrc} alt={item.productName}
                                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                            onError={e => { e.currentTarget.src = FALLBACK_IMG; }}
                                            loading="lazy" />
                                    </Link>

                                    {/* Thông tin sản phẩm */}
                                    <div className="flex-1 min-w-0">
                                        <Link to={`/hoa/${item.slug}`}
                                            className="text-sm md:text-base font-semibold leading-snug hover:underline line-clamp-2"
                                            style={{ color: 'var(--craft-brown)' }}>
                                            {item.productName}
                                        </Link>

                                        {item.categoryName && (
                                            <span className="inline-block mt-1.5 text-[10px] font-medium px-2.5 py-0.5 rounded-full"
                                                style={{ backgroundColor: 'var(--craft-beige)', color: 'var(--craft-amber)' }}>
                                                {item.categoryName}
                                            </span>
                                        )}

                                        {/* Giá */}
                                        <div className="flex items-baseline gap-2 mt-2">
                                            {item.isOnSale && item.salePrice != null ? (
                                                <>
                                                    <span className="font-bold text-base" style={{ color: '#d4460c' }}>
                                                        {formatVnd(item.salePrice)}
                                                    </span>
                                                    <span className="text-xs line-through" style={{ color: 'var(--craft-muted)' }}>
                                                        {formatVnd(item.price)}
                                                    </span>
                                                    <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                                        -{Math.round((1 - item.salePrice / item.price) * 100)}%
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="font-bold text-base" style={{ color: 'var(--craft-brown)' }}>
                                                    {formatVnd(item.price)}
                                                </span>
                                            )}
                                        </div>

                                        {/* Stock status */}
                                        <p className={`text-[11px] mt-1 font-medium ${item.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {item.stock > 0 ? `✓ Còn hàng (${item.stock})` : '✗ Hết hàng'}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <button onClick={() => handleAddToCart(item)}
                                            disabled={item.stock === 0}
                                            className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                                            <ShoppingCart size={14} /> Thêm giỏ
                                        </button>
                                        <button onClick={() => handleRemove(item.productId)}
                                            disabled={isRemoving}
                                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors hover:bg-red-50 text-red-400 hover:text-red-600">
                                            <Trash2 size={13} /> Xóa
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom CTA */}
            <div className="mt-10 text-center">
                <Link to="/hoa" className="btn-outline">
                    Tiếp tục khám phá
                </Link>
            </div>
        </div>
    );
}
