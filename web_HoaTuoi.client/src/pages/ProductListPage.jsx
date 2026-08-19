// src/pages/ProductListPage.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, RotateCcw } from 'lucide-react';
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
    flowerType:   searchParams.get('flowerType') || undefined,
    occasion:     searchParams.get('occasion') || undefined,
    q:            searchParams.get('q') || undefined,
    color:        searchParams.get('color') || undefined,
    minPrice:     searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice:     searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sortBy:       searchParams.get('sortBy') || 'newest',
    page:         searchParams.get('page') ? Number(searchParams.get('page')) : 1,
    pageSize:     100,
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

  function removeFilter(key) {
    const next = new URLSearchParams(searchParams);
    next.delete(key);
    next.set('page', '1');
    setSearchParams(next);
  }

  let pageTitle = 'Tất cả sản phẩm';
  if (filters.q) {
    pageTitle = `Tìm kiếm: "${filters.q}"`;
  } else if (filters.categorySlug && filters.flowerType) {
    pageTitle = `${filters.categorySlug.replace(/-/g, ' ')} — ${filters.flowerType}`;
  } else if (filters.flowerType) {
    pageTitle = `Loại hoa: ${filters.flowerType}`;
  } else if (filters.occasion) {
    pageTitle = `Dịp tặng: ${filters.occasion}`;
  } else if (filters.categorySlug) {
    pageTitle = filters.categorySlug.replace(/-/g, ' ');
  }

  const activeBadges = [];
  if (filters.categorySlug) {
    activeBadges.push({
      key: 'category',
      label: `Danh mục: ${filters.categorySlug.replace(/-/g, ' ')}`
    });
  }
  if (filters.flowerType) {
    activeBadges.push({
      key: 'flowerType',
      label: `Loại hoa: ${filters.flowerType}`
    });
  }
  if (filters.occasion) {
    activeBadges.push({
      key: 'occasion',
      label: `Dịp: ${filters.occasion}`
    });
  }
  if (filters.q) {
    activeBadges.push({
      key: 'q',
      label: `Từ khóa: ${filters.q}`
    });
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 capitalize">{pageTitle}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{total} sản phẩm phù hợp</p>
        </div>
        <button
          onClick={() => setFilterOpen(v => !v)}
          className="md:hidden flex items-center gap-2 btn-outline text-sm py-2 dark:text-gray-200"
        >
          <SlidersHorizontal size={16} /> Bộ lọc
        </button>
      </div>

      {/* Active Filter Badges */}
      {activeBadges.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-pink-50/50 dark:bg-slate-800/40 rounded-xl border border-pink-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Đang lọc theo:</span>
          {activeBadges.map(b => (
            <span
              key={b.key}
              className="inline-flex items-center gap-1 text-xs font-medium bg-white dark:bg-slate-900 border border-pink-200 dark:border-slate-700 text-pink-700 dark:text-pink-400 px-2.5 py-1 rounded-full shadow-2xs"
            >
              {b.label}
              <button
                onClick={() => removeFilter(b.key)}
                className="hover:text-red-500 cursor-pointer ml-1"
                title="Xóa bộ lọc này"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <button
            onClick={() => setSearchParams({})}
            className="text-xs text-red-500 hover:text-red-600 dark:text-red-400 ml-auto flex items-center gap-1 font-medium cursor-pointer"
          >
            <RotateCcw size={12} /> Xóa tất cả
          </button>
        </div>
      )}

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
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-slate-800 text-gray-400 p-8">
              <p className="text-5xl mb-4">🌸</p>
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200">Không tìm thấy sản phẩm phù hợp</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hãy thử chọn danh mục hoặc loại hoa khác</p>
              <button
                onClick={() => setSearchParams({})}
                className="mt-4 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Xem tất cả sản phẩm
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map(p => <FlowerCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
