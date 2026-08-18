// src/store/categoriesStore.js
// Zustand store: fetch & cache categories từ API một lần duy nhất mỗi session
import { create } from 'zustand';
import { categoryApi } from '../api/categories';

/**
 * @typedef {import('../api/categories').CategoryDto} CategoryDto
 */

export const useCategoriesStore = create((set, get) => ({
  /** @type {CategoryDto[]} */
  categories: [],
  flowerTypes: [],
  occasions: [],
  loading: false,
  error: null,

  /** Gọi API nếu chưa có dữ liệu — an toàn khi gọi nhiều lần */
  fetchIfEmpty: async () => {
    const { categories, loading } = get();
    if (categories.length > 0 || loading) return;

    set({ loading: true, error: null });
    try {
      const [catsData, filtersData] = await Promise.all([
        categoryApi.getAll(),
        categoryApi.getActiveFilters()
      ]);
      set({ 
        categories: catsData, 
        flowerTypes: filtersData.flowerTypes,
        occasions: filtersData.occasions,
        loading: false 
      });
    } catch {
      set({ error: 'Không thể tải danh mục.', loading: false });
    }
  },
}));
