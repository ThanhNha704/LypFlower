import { useEffect } from 'react';
import { useCategoriesStore } from '../../store/categoriesStore';

// Component nhỏ hiển thị từng section
function FilterSection({ title, count, children }) {
    return (
        <div>
            <div className="flex items-center justify-between mb-2.5">
                <h4 className="font-semibold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {title}
                </h4>
                {count !== undefined && (
                    <span className="text-[10px] bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 font-medium px-1.5 py-0.5 rounded-full">
                        {count}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

export default function ProductFilter({ filters = {}, onChange }) {
    const { categories, flowerTypes, occasions, fetchIfEmpty } = useCategoriesStore();

    useEffect(() => {
        fetchIfEmpty();
    }, [fetchIfEmpty]);

    // Danh sách danh mục / bộ sưu tập chính
    const categoryOptions = categories
        .filter(cat => cat.productCount > 0)
        .map(cat => ({
            label: cat.name,
            value: cat.slug,
            count: cat.productCount
        }));

    const sortOptions = [
        { value: "newest", label: "Mới nhất" },
        { value: "price_asc", label: "Giá tăng dần" },
        { value: "price_desc", label: "Giá giảm dần" },
        { value: "best_seller", label: "Bán chạy nhất" },
        { value: "discount_desc", label: "% Giảm giá cao nhất" }
    ];

    const hasActiveFilters = Boolean(
        filters.categorySlug || filters.flowerType || filters.occasion || (filters.sortBy && filters.sortBy !== 'newest')
    );

    return (
        <aside className="space-y-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sticky top-20 shadow-sm">

            {/* Sắp xếp */}
            <FilterSection title="Sắp xếp">
                <select
                    value={filters.sortBy ?? "newest"}
                    onChange={(e) => onChange({ sortBy: e.target.value })}
                    className="input text-xs w-full bg-transparent dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg py-2 cursor-pointer focus:border-pink-500"
                >
                    {sortOptions.map((o) => (
                        <option key={o.value} value={o.value} className="dark:bg-slate-900">
                            {o.label}
                        </option>
                    ))}
                </select>
            </FilterSection>

            {/* Danh mục / Chủ đề */}
            <FilterSection title="Danh mục">
                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    <button
                        type="button"
                        onClick={() => onChange({ category: undefined })}
                        className={`w-full flex items-center justify-between text-left text-[11px] font-semibold py-2 px-3 rounded-xl border transition-all ${
                            !filters.categorySlug
                                ? 'bg-[#E92E69] text-white border-[#E92E69] shadow-sm shadow-pink-100'
                                : 'border-gray-100 dark:border-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-750 dark:text-gray-300 bg-white dark:bg-slate-900/50'
                        }`}
                    >
                        <span>Tất cả danh mục</span>
                    </button>

                    {categoryOptions.map((c) => {
                        const isSelected = filters.categorySlug === c.value;
                        return (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => onChange({ category: isSelected ? undefined : c.value })}
                                className={`w-full flex items-center justify-between text-left text-[11px] font-medium py-2 px-3 rounded-xl border transition-all ${
                                    isSelected
                                        ? 'bg-[#E92E69] text-white border-[#E92E69] shadow-sm shadow-pink-100 font-semibold'
                                        : 'border-gray-100 dark:border-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-750 dark:text-gray-300 bg-white dark:bg-slate-900/50'
                                }`}
                            >
                                <span className="truncate" title={c.label}>{c.label}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                    isSelected 
                                        ? 'bg-white/20 text-white' 
                                        : 'bg-gray-150 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                }`}>
                                    {c.count}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </FilterSection>


            {/* Clear filter */}
            {hasActiveFilters && (
                <button
                    type="button"
                    onClick={() =>
                        onChange({
                            category: undefined,
                            flowerType: undefined,
                            occasion: undefined,
                            sortBy: "newest"
                        })
                    }
                    className="text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 font-medium w-full pt-3 border-t border-gray-100 dark:border-slate-800 transition-colors flex items-center justify-center gap-1"
                >
                    ✕ Xóa tất cả bộ lọc
                </button>
            )}

        </aside>
    );
}