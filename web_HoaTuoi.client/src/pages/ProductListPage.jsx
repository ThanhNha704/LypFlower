// src/pages/ProductListPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import FlowerCard from '../components/product/FlowerCard';
import FlowerFilter from '../components/product/FlowerFilter';
import { productApi } from '../api/products';
import { resolveImage } from '../utils/imageResolver';

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);

  const filters = {
    categorySlug: searchParams.get('category') || undefined,
    q:        searchParams.get('q') || undefined,
    material: searchParams.get('material') || undefined,
    style:    searchParams.get('style') || undefined,
    occasion: searchParams.get('occasion') || undefined,
    color:    searchParams.get('color') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sortBy:   searchParams.get('sortBy') || 'newest',
    page: searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    pageSize: 100,
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    productApi.getProducts(filters)
   .then(res => {
        if (!cancelled) {
          setProducts(res.items.map(p => ({ ...p, mainImageUrl: resolveImage(p.mainImageUrl) })));
          setTotal(res.total);
        }
      })
      .catch(() => {
        if (!cancelled) { setProducts([]); setTotal(0); }
    })
   .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleFilterChange(changed) {
    const next = new URLSearchParams(searchParams);
    Object.entries(changed).forEach(([k, v]) => {
      if (v === undefined || v === '') next.delete(k);
      else next.set(k, String(v));
    });
    next.set('page', '1');
    setSearchParams(next);
  }

  const categoryTitleMap = {
    'hoa-sinh-nhat': 'Hoa Sinh Nhật',
    'hoa-khai-truong': 'Hoa Khai Trương',
    'hoa-cuoi-cho-co-dau': 'Hoa Cưới & Cô Dâu',
    'hoa-chia-buon-tang-le': 'Hoa Chia Buồn & Tang Lễ',
    'hoa-theo-loai': 'Hoa Theo Loại',
    'hoa-thiet-ke-theo-kieu-dang': 'Hoa Thiết Kế Theo Kiểu Dáng',
    'hoa-chu-de-dip-le': 'Hoa Chủ Đề Dịp Lễ',
    'hoa-sap-hoa-kho': 'Hoa Sáp & Hoa Khô',
    'cay-canh-chau-hoa-de-ban': 'Cây Cảnh & Chậu Hoa Để Bàn',
    'qua-tang-kem': 'Quà Tặng Kèm',
    'hoa-choi-tet-nu-tam-xuan': 'Hoa Chơi Tết & Nụ Tầm Xuân',
    'dich-vu-trang-tri-hoa-su-kien': 'Dịch Vụ Trang Trí Hoa Sự Kiện',
    'goi-dang-ky-hoa-dinh-ky': 'Gói Đăng Ký Hoa Định Kỳ'
  };

  const pageTitle = filters.q
    ? `Kết quả tìm kiếm: "${filters.q}"`
    : filters.categorySlug
      ? categoryTitleMap[filters.categorySlug] || filters.categorySlug.replace(/-/g, ' ')
      : 'Tất cả sản phẩm';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">{pageTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} sản phẩm</p>
        </div>
        <button onClick={() => setFilterOpen(v => !v)}
          className="md:hidden flex items-center gap-2 btn-outline text-sm py-2 dark:text-gray-200">
          <SlidersHorizontal size={16} /> Bộ lọc
        </button>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar */}
        <aside className={`
          ${filterOpen ? 'fixed inset-0 z-40 bg-white dark:bg-[#121212] p-4 overflow-y-auto' : 'hidden'}
    md:block md:static md:z-auto md:bg-transparent md:p-0
          w-full md:w-64 flex-shrink-0
        `}>
          {filterOpen && (
       <div className="flex items-center justify-between mb-4 md:hidden">
    <span className="font-semibold text-gray-900 dark:text-gray-100">Bộ lọc</span>
   <button onClick={() => setFilterOpen(false)} className="dark:text-gray-300"><X size={20} /></button>
    </div>
          )}
          <FlowerFilter filters={filters} onChange={handleFilterChange} />
 </aside>

    {/* Product grid */}
<div className="flex-1">
          {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 12 }).map((_, i) => (
         <div key={i} className="aspect-square rounded-2xl bg-gray-100 animate-pulse" />
     ))}
     </div>
    ) : products.length === 0 ? (
    <div className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">🔍</p>
       <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
              <button onClick={() => setSearchParams({})} className="mt-4 btn-outline text-sm">
      Xóa bộ lọc
              </button>
          </div>
          ) : (
            <>
  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => <FlowerCard key={p.id} product={p} />)}
  </div>
       </>
    )}
 </div>
      </div>
    </div>
  );
}
