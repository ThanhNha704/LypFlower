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
        { value: "best_seller", label: "Bán chạy nhất" }
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
                <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {categoryOptions.map((c) => {
                        const isSelected = filters.categorySlug === c.value;
                        return (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => onChange({ category: isSelected ? undefined : c.value })}
                                className={`flex items-center justify-between text-left text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-all ${
                                    isSelected
                                        ? 'bg-pink-50 dark:bg-pink-900/25 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400 font-semibold shadow-xs'
                                        : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <span className="truncate" title={c.label}>{c.label}</span>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => onChange({ category: undefined })}
                        className={`text-center text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-all ${
                            !filters.categorySlug
                                ? 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 font-semibold'
                                : 'border-dashed border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400'
                        }`}
                    >
                        Tất cả danh mục
                    </button>
                </div>
            </FilterSection>

            {/* Loại hoa */}
            <FilterSection title="Loại hoa">
                <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                    {flowerTypes.map((f) => {
                        const isSelected = filters.flowerType === f;
                        return (
                            <button
                                key={f}
                                type="button"
                                onClick={() => onChange({ flowerType: isSelected ? undefined : f })}
                                className={`flex items-center justify-between text-left text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-all ${
                                    isSelected
                                        ? 'bg-pink-50 dark:bg-pink-900/25 border-pink-300 dark:border-pink-700 text-pink-700 dark:text-pink-400 font-semibold shadow-xs'
                                        : 'border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60 text-gray-600 dark:text-gray-400'
                                }`}
                            >
                                <span className="truncate" title={f}>{f}</span>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => onChange({ flowerType: undefined })}
                        className={`text-center text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-all ${
                            !filters.flowerType
                                ? 'bg-gray-100 dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 font-semibold'
                                : 'border-dashed border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400'
                        }`}
                    >
                        Tất cả loại hoa
                    </button>
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