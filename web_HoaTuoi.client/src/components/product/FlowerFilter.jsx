import { useEffect } from 'react';
import { useCategoriesStore } from '../../store/categoriesStore';

// Component nhỏ hiển thị từng section
function FilterSection({ title, children }) {
    return (
        <div>
            <h4 className="font-semibold text-sm text-gray-800 mb-3">
                {title}
            </h4>
            {children}
        </div>
    );
}

export default function ProductFilter({ filters = {}, onChange }) {
    const { categories, fetchIfEmpty } = useCategoriesStore();

    useEffect(() => {
        fetchIfEmpty();
    }, [fetchIfEmpty]);

    const flowerTypes = categories.map(cat => ({
        label: cat.name,
        value: cat.slug
    }));

    const occasions = [
        "Sinh nhật",
        "Khai trương",
        "Tình yêu",
        "Chúc mừng"
    ];



    const sortOptions = [
        { value: "newest", label: "Mới nhất" },
        { value: "price_asc", label: "Giá tăng dần" },
        { value: "price_desc", label: "Giá giảm dần" },
        { value: "best_seller", label: "Bán chạy nhất" }
    ];

    return (
        <aside className="space-y-6 bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-100 dark:border-slate-800 p-4 sticky top-20 shadow-sm">

            {/* Sắp xếp */}
            <FilterSection title="Sắp xếp">
                <select
                    value={filters.sortBy ?? "newest"}
                    onChange={(e) => onChange({ sortBy: e.target.value })}
                    className="input text-sm w-full bg-transparent dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg py-2"
                >
                    {sortOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
            </FilterSection>

            {/* Loại hoa */}
            <FilterSection title="Loại hoa">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">

                    {flowerTypes.map((f) => (
                        <label
                            key={f.value}
                            className={`flex items-center gap-2 text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${filters.categorySlug === f.value ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-400' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400'}`}
                        >
                            <input
                                type="radio"
                                name="category"
                                value={f.value}
                                checked={filters.categorySlug === f.value}
                                onClick={() => {
                                    if (filters.categorySlug === f.value) onChange({ category: undefined });
                                }}
                                onChange={() => onChange({ category: f.value })}
                                className="hidden"
                            />
                            <span className="truncate">{f.label}</span>
                        </label>
                    ))}

                    <label className={`flex items-center gap-2 text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${!filters.categorySlug ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400'}`}>
                        <input
                            type="radio"
                            name="category"
                            value=""
                            checked={!filters.categorySlug}
                            onChange={() => onChange({ category: undefined })}
                            className="hidden"
                        />
                        Tất cả
                    </label>

                </div>
            </FilterSection>

            {/* Dịp tặng */}
            <FilterSection title="Dịp tặng">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">

                    {occasions.map((o) => (
                        <label
                            key={o}
                            className={`flex items-center gap-2 text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${filters.occasion === o ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-400' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-400'}`}
                        >
                            <input
                                type="radio"
                                name="occasion"
                                value={o}
                                checked={filters.occasion === o}
                                onClick={() => {
                                    if (filters.occasion === o) onChange({ occasion: undefined });
                                }}
                                onChange={() => onChange({ occasion: o })}
                                className="hidden"
                            />
                            <span className="truncate">{o}</span>
                        </label>
                    ))}

                    <label className={`flex items-center gap-2 text-[11px] font-medium py-1.5 px-2 rounded-lg border transition-all cursor-pointer ${!filters.occasion ? 'bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-gray-100' : 'border-transparent hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-400'}`}>
                        <input
                            type="radio"
                            name="occasion"
                            value=""
                            checked={!filters.occasion}
                            onChange={() => onChange({ occasion: undefined })}
                            className="hidden"
                        />
                        Tất cả
                    </label>

                </div>
            </FilterSection>

            {/* Clear filter */}
            <button
                type="button"
                onClick={() =>
                    onChange({
                        category: undefined,
                        occasion: undefined,
                        sortBy: "newest"
                    })
                }
                className="text-xs text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 w-full pt-2 border-t border-gray-100 dark:border-slate-800"
            >
                Xóa tất cả bộ lọc
            </button>

        </aside>
    );
}