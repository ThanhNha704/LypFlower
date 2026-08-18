// src/api/wishlist.ts
import apiClient from './client';

export const wishlistApi = {
  /** Lấy danh sách sản phẩm yêu thích (detail) */
  getWishlist: () => apiClient.get('/wishlist').then((r) => r.data),

  /** Lấy mảng ID sản phẩm đã yêu thích */
  getWishlistIds: () => apiClient.get('/wishlist/ids').then((r) => r.data),

  /** Thêm/Xóa khỏi danh sách yêu thích */
  toggle: (productId: string | number) =>
    apiClient.post(`/wishlist/toggle/${productId}`).then((r) => r.data),

  /** Xóa cụ thể khỏi danh sách */
  remove: (productId: string | number) =>
    apiClient.delete(`/wishlist/${productId}`).then((r) => r.data),
};
