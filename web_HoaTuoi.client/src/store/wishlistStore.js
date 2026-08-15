// src/store/wishlistStore.js
import { create } from 'zustand';
import { wishlistApi } from '../api/wishlist.ts';

export const useWishlistStore = create((set, get) => ({
    /** Danh sách productId đã yêu thích */
    ids: [],

    /** Đã fetch lần đầu chưa */
    fetched: false,

    /** Đang loading */
    loading: false,

    /**
     * Fetch danh sách productId yêu thích từ server
     * Chỉ gọi khi user đã đăng nhập
     */
    fetchIds: async () => {
        try {
            set({ loading: true });
            const ids = await wishlistApi.getWishlistIds();
            set({ ids, fetched: true, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    /** Fetch nếu chưa fetch lần nào */
    fetchIfNeeded: () => {
        if (!get().fetched) {
            get().fetchIds();
        }
    },

    /** Kiểm tra productId có trong wishlist không */
    isInWishlist: (productId) => get().ids.includes(productId),

    /**
     * Toggle yêu thích — gọi API và cập nhật local state
     * @returns {{ isInWishlist: boolean, message: string }}
     */
    toggle: async (productId) => {
        try {
            const result = await wishlistApi.toggle(productId);
            if (result.isInWishlist) {
                set({ ids: [...get().ids, productId] });
            } else {
                set({ ids: get().ids.filter((id) => id !== productId) });
            }
            return result;
        } catch (err) {
            throw err;
        }
    },

    /** Xóa khỏi wishlist — gọi API và cập nhật local state */
    remove: async (productId) => {
        try {
            await wishlistApi.remove(productId);
            set({ ids: get().ids.filter((id) => id !== productId) });
        } catch (err) {
            throw err;
        }
    },

    /** Reset state (khi logout) */
    reset: () => set({ ids: [], fetched: false, loading: false }),
}));
