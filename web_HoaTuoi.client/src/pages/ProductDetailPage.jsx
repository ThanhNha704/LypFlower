// src/pages/ProductDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Heart, ChevronRight, ZoomIn, Camera, X } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import { useWishlistStore } from '../store/wishlistStore';
import FlowerCard from '../components/product/FlowerCard';
import ProductGallery from '../components/product/ProductGallery';
import FlowerInfo from '../components/product/FlowerInfo';
import RatingStars from '../components/common/RatingStars';
import { productApi } from '../api/products';
import { reviewApi } from '../api/reviews';
import { formatVnd } from '../utils/format';
import { resolveImage } from '../utils/imageResolver';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('desc');
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '', isSubmitting: false });
  const [images, setImages] = useState([]);
  const addItem = useCartStore(s => s.addItem);
  const { user } = useAuthStore();
  const [canReview, setCanReview] = useState(false);
  const wishlistIds = useWishlistStore(s => s.ids);
  const toggleWishlist = useWishlistStore(s => s.toggle);
  const isWishlisted = product ? wishlistIds.includes(product.id) : false;

  useEffect(() => {
    setLoading(true);
    productApi.getProductBySlug(slug)
      .then(res => setProduct(res))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (user && product) {
      reviewApi.checkCanReview(product.id)
        .then(res => {
          setCanReview(res.canReview);
          if (res.existingReview) {
            setReviewForm(prev => ({
              ...prev,
              rating: res.existingReview.rating,
              comment: res.existingReview.comment
            }));
            if (res.existingReview.images) {
              // Set existing images
              setImages(res.existingReview.images);
            }
          }
        })
        .catch(() => setCanReview(false));
    }
  }, [user, product]);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square bg-gray-100 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          {[60, 40, 30, 80].map(w => (
            <div key={w} className={`h-6 bg-gray-100 rounded animate-pulse w-${w}/100`} />
          ))}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="max-w-7xl mx-auto px-4 py-20 text-center">
      <p className="text-5xl mb-4">😔</p>
      <p className="text-lg text-gray-600">Không tìm thấy sản phẩm</p>
      <Link to="/hoa" className="btn-primary mt-4 inline-block">Quay lại</Link>
    </div>
  );

  function handleAddToCart() {
    addItem(product, qty);
    toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`);
  }

  async function handleToggleWishlist() {
    if (!user) {
      toast.error('Vui lòng đăng nhập để sử dụng danh sách yêu thích!');
      return;
    }
    try {
      const result = await toggleWishlist(product.id);
      toast.success(result.message);
    } catch {
      toast.error('Có lỗi xảy ra, vui lòng thử lại.');
    }
  }

  function handleImageChange(e) {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      toast.error('Chỉ được tải lên tối đa 3 ảnh');
      return;
    }
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  }

  function removeImage(index) {
    setImages(prev => prev.filter((_, i) => i !== index));
  }

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }
    setReviewForm(prev => ({ ...prev, isSubmitting: true }));
    try {
      await reviewApi.createReview({
        productId: product.id,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
        imageBase64List: images
      });
      toast.success('Cảm ơn bạn đã đánh giá!');
      setReviewForm({ rating: 5, comment: '', isSubmitting: false });
      setImages([]);
      // Tải lại thông tin sản phẩm để cập nhật đánh giá mới
      productApi.getProductBySlug(slug).then(res => setProduct(res));
    } catch (error) {
      toast.error('Có lỗi xảy ra khi gửi đánh giá.');
      setReviewForm(prev => ({ ...prev, isSubmitting: false }));
    }
  }

  const displayPrice = product.price;
  const originalPrice = product.price;
  const discountPct = 0;

  // Resolve ảnh từ DB path → bundled Vite URL
  const resolvedMainImage = resolveImage(product.mainImageUrl);
  const resolvedSubImages = (product.subImages ?? []).map(img => ({
    ...img,
    url: resolveImage(img.url),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-amber-500">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to={product.category ? `/hoa?category=${product.category.slug}` : "/hoa"} className="hover:text-amber-500">
          {product.category ? product.category.name : "Sản phẩm"}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-700 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main content */}
      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Gallery */}
        <ProductGallery mainImageUrl={resolvedMainImage} subImages={resolvedSubImages} name={product.name} />

        {/* Info */}
        <div className="space-y-4">
          {product.isActive === false ? (
            <div className="bg-gray-100 border border-gray-200 rounded-2xl p-4 text-gray-700 text-xs font-semibold flex items-center gap-2">
              ⚠️ Sản phẩm này đã ngừng kinh doanh. Quý khách có thể tham khảo các sản phẩm khác dưới đây.
            </div>
          ) : product.stock === 0 ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-amber-700 text-xs font-semibold flex items-center gap-2">
              ⚠️ Sản phẩm này tạm thời hết hàng. Quý khách vui lòng chọn sản phẩm khác hoặc liên hệ hotline.
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-gray-900 leading-snug">{product.name}</h1>
            <button onClick={handleToggleWishlist}
              className={`p-2 rounded-full transition-colors flex-shrink-0 ${isWishlisted ? 'bg-red-50' : 'hover:bg-red-50'}`}
              title={isWishlisted ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}>
              <Heart size={22} className={`transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`} />
            </button>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-4 py-1">
            <div className="flex items-center gap-1.5">
              <RatingStars rating={product.averageRating || 5} size={18} color="#FFB800" />
              <span className="text-lg font-black text-[#FFB800]">
                {(product.averageRating || 5).toFixed(1)}
              </span>
            </div>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900 underline underline-offset-4 decoration-gray-200">
                {product.reviewCount || 0}
              </span>
              <span className="text-xs text-gray-400 font-medium">đánh giá</span>
            </div>
            <div className="h-4 w-[1px] bg-gray-200"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-gray-900">
                {product.soldCount || 0}
              </span>
              <span className="text-xs text-gray-400 font-medium tracking-tight">đã bán</span>
            </div>
          </div>

          {/* Price */}
          <div className="space-y-1">
            <span className="text-3xl font-bold text-gray-900">{formatVnd(product.price)}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="bg-pink-50 text-pink-700 text-xs font-medium px-3 py-1 rounded-full">
              {product.category?.name}
            </span>
          </div>

          {/* Kích thước */}
          <FlowerInfo product={product} />

          {/* Stock */}
          <p className={`text-sm font-medium ${product.isActive === false ? 'text-gray-500' : product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {product.isActive === false ? '✗ Ngừng kinh doanh' : product.stock > 0 ? `✓ Còn hàng (${product.stock})` : '✗ Tạm hết hàng'}
          </p>

          {/* Information Badges */}
          <div className="grid grid-cols-2 gap-3 py-4 border-y border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">✨</div>
              <span className="text-[11px] text-gray-600 font-medium">Hoa tươi 100% nhập mới mỗi ngày</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">🚚</div>
              <span className="text-[11px] text-gray-600 font-medium">Giao hàng hỏa tốc trong 2 giờ</span>
            </div>
          </div>

          {/* Qty + Add to cart */}
          {user && (user.role === 'Admin' || user.role === 'Staff') ? (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 text-sm font-semibold mt-4 text-center uppercase tracking-widest">
              Chức năng đặt hàng chỉ dành cho tài khoản Khách Hàng
            </div>
          ) : (
          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button 
                  onClick={() => setQty(v => Math.max(1, v - 1))}
                  disabled={qty <= 1 || product.stock === 0 || product.isActive === false}
                  className="w-10 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-lg font-medium disabled:opacity-30"
                >
                  −
                </button>
                <input 
                  type="number"
                  min="1"
                  max={product.stock || 1}
                  value={qty}
                  disabled={product.stock === 0 || product.isActive === false}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val <= 0) {
                      // Allow empty temporarily
                    } else if (val > product.stock) {
                      toast.error(`Chỉ còn ${product.stock} sản phẩm trong kho`);
                      setQty(product.stock);
                    } else {
                      setQty(val);
                    }
                  }}
                  onBlur={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (isNaN(val) || val <= 0) {
                      setQty(1);
                    }
                  }}
                  className="w-12 text-center text-sm font-semibold border-y-0 border-x border-gray-200 focus:outline-none focus:ring-0 p-0 h-11"
                />
                <button 
                  onClick={() => setQty(v => Math.min(product.stock, v + 1))}
                  disabled={qty >= product.stock || product.stock === 0 || product.isActive === false}
                  className="w-10 h-11 flex items-center justify-center hover:bg-gray-50 text-gray-600 text-lg font-medium disabled:opacity-30"
                >
                  +
                </button>
              </div>
              <button 
                onClick={handleAddToCart} 
                disabled={product.stock === 0 || product.isActive === false}
                className="flex-1 h-11 bg-[#E92E69] text-white rounded-xl font-bold hover:bg-pink-600 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart size={18} /> {product.isActive === false ? "NGỪNG KINH DOANH" : product.stock === 0 ? "TẠM HẾT HÀNG" : "THÊM VÀO GIỎ HÀNG"}
              </button>
            </div>
            
            <button className="w-full h-11 border-2 border-[#E92E69] text-[#E92E69] rounded-xl font-bold hover:bg-pink-50 transition">
              TƯ VẤN NHANH (ZALO/HOTLINE)
            </button>
          </div>
          )}
        </div>
      </div>

      {/* Tabs: Mô tả / Thông số / Đánh giá */}
      <div className="border-b border-gray-200 flex gap-6 mb-6">
        {[
          { key: 'desc', label: 'Mô tả' },
          { key: 'spec', label: 'Thông tin' },
          { key: 'review', label: `Đánh giá (${product.reviewCount})` },
        ].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors
     ${activeTab === t.key ? 'border-pink-500 text-pink-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'desc' && (
        <div className="grid md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-8">
            <div className="text-gray-700 leading-relaxed text-sm whitespace-pre-line">{product.description}</div>
            
            <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-gray-900 border-l-4 border-[#E92E69] pl-3">Chính sách & Cam kết</h3>
              <ul className="text-xs text-gray-600 space-y-2 list-disc pl-4">
                <li>Cam kết hoa tươi 100% trong vòng 3 ngày.</li>
                <li>Hoàn tiền 100% nếu không hài lòng về chất lượng sản phẩm.</li>
                <li>Giao sản phẩm đúng mẫu 90-95% (tùy thuộc vào mùa hoa).</li>
                <li>Tặng kèm thiệp/banner viết thông điệp miễn phí.</li>
              </ul>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-pink-50 rounded-2xl p-6">
              <h3 className="font-bold text-pink-700 mb-4 flex items-center gap-2">
                <span>🌿</span> Hướng dẫn chăm sóc
              </h3>
              <ul className="text-xs text-pink-600 space-y-3">
                <li className="flex gap-2"><span>1.</span> Thay nước mỗi ngày, cắt tỉa gốc xéo 45 độ.</li>
                <li className="flex gap-2"><span>2.</span> Tránh ánh nắng trực tiếp và gió máy lạnh.</li>
                <li className="flex gap-2"><span>3.</span> Sử dụng nước sạch, có thể thêm gói dưỡng hoa.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'spec' && <FlowerInfo product={product} detailed />}

      {activeTab === 'review' && (
        <div className="space-y-8 max-w-2xl">
          
          {/* Biểu mẫu đánh giá */}
          <div className="bg-gray-50 border border-gray-100 p-6 rounded-2xl">
            <h3 className="font-bold text-lg mb-4 text-gray-900 border-l-4 border-[#E92E69] pl-3">Viết đánh giá của bạn</h3>
            {!user ? (
              <div className="text-center py-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-gray-600 mb-4">Vui lòng đăng nhập để gửi đánh giá cho sản phẩm này.</p>
                <Link to="/dang-nhap" className="btn-primary inline-block shadow-md">Đăng nhập nhanh</Link>
              </div>
            ) : !canReview ? (
              <div className="text-center py-6 bg-white rounded-xl border border-gray-100 shadow-sm">
                <p className="text-gray-600">Bạn cần mua sản phẩm này và nhận hàng thành công để có thể đánh giá.</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Chất lượng sản phẩm:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        className={`text-3xl transition-all drop-shadow-sm ${reviewForm.rating >= star ? 'text-[#FFB800] scale-110' : 'text-gray-200 hover:text-amber-200'}`}
                        aria-label={`${star} sao`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chia sẻ trải nghiệm của bạn:</label>
                  <textarea
                    rows="4"
                    className="w-full rounded-xl border border-gray-200 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] focus:border-pink-500 focus:ring-pink-500 focus:ring-4 focus:ring-pink-500/10 text-sm p-4 text-gray-700 transition-all transition-shadow outline-none"
                    placeholder="Chất lượng hoa tuyệt vời, đóng gói rất cẩn thận..."
                    value={reviewForm.comment}
                    onChange={e => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                  ></textarea>
                </div>
                
                {/* Phần chọn ảnh */}
                <div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                        <img src={img.startsWith('data:') ? img : resolveImage(img)} alt="review" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-white/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:bg-gray-100">
                          <X size={14} className="text-gray-700" />
                        </button>
                      </div>
                    ))}
                    {images.length < 3 && (
                      <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-pink-50 hover:border-pink-300 transition-all text-gray-500 group">
                        <Camera size={24} className="mb-2 text-gray-400 group-hover:text-pink-400 transition-colors" />
                        <span className="text-[11px] font-medium group-hover:text-pink-500 transition-colors">Thêm ảnh</span>
                        <input type="file" accept="image/jpeg, image/png, image/webp" multiple className="hidden" onChange={handleImageChange} />
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 font-medium">Đính kèm tối đa 3 ảnh thực tế của sản phẩm (tùy chọn).</p>
                </div>
                
                <button
                  type="submit"
                  disabled={reviewForm.isSubmitting}
                  className="bg-[#E92E69] text-white px-8 py-3 rounded-xl font-bold hover:bg-pink-600 transition disabled:opacity-50 shadow-md shadow-pink-200 flex items-center gap-2"
                >
                  {reviewForm.isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang gửi...
                    </>
                  ) : 'Gửi đánh giá ngay'}
                </button>
              </form>
            )}
          </div>

          {/* Danh sách Review */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Đánh giá từ khách hàng ({product.reviewCount || 0})</span>
            </h3>
            
            {(!product.latestReviews || product.latestReviews.length === 0) && (
              <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                <p className="text-gray-400 text-sm">Chưa có đánh giá nào. Hãy là người đầu tiên trải nghiệm!</p>
              </div>
            )}
            
            {product.latestReviews?.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center text-amber-800 font-black shadow-inner">
                      {r.userName[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{r.userName}</p>
                      <RatingStars rating={r.rating} size={14} color="#FFB800" />
                    </div>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    {new Date(r.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                
                <p className="text-[14px] text-gray-700 leading-relaxed mt-3">{r.comment}</p>
                
                {r.imageUrls && r.imageUrls.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {r.imageUrls.map((imgUrl, idx) => (
                      <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer hover:opacity-90 hover:scale-[1.03] transition-all">
                        <img src={imgUrl} alt="review pic" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                
                {r.adminReply && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                    <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-50 border-l border-t border-gray-100 rotate-45"></div>
                    <p className="text-sm font-bold text-[#E92E69] mb-1">Cửa hàng Lyp Flower</p>
                    <p className="text-sm text-gray-600 leading-relaxed">{r.adminReply}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sản phẩm mua kèm */}
      {product.bundledProducts?.length > 0 && (
        <section className="mt-14 pt-10 border-t border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-8 text-center uppercase tracking-widest">Sản phẩm thường mua kèm</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {product.bundledProducts.map(b => (
              <FlowerCard key={b.id} product={{ ...b, mainImageUrl: resolveImage(b.mainImageUrl) }} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
