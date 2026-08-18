// src/api/reviews.ts
import apiClient from './client';

export interface ShopStats {
  averageRating: number;
  totalReviews: number;
  totalSold: number;
}

export const reviewApi = {
  /** Lấy thống kê tổng hợp của shop */
  getShopStats: () =>
    apiClient.get<ShopStats>('/reviews/shop-stats').then((r) => r.data),

  /** Lấy đánh giá của một sản phẩm */
  getProductReviews: (productId: number) =>
    apiClient.get<any[]>(`/reviews/product/${productId}`).then((r) => r.data),

  /** Gửi đánh giá mới */
  createReview: (data: any) =>
    apiClient.post('/reviews', data).then((r) => r.data),

  /** Kiểm tra xem user có được đánh giá không (đã mua hàng) */
  checkCanReview: (productId: number) =>
    apiClient.get<{ canReview: boolean, existingReview: any }>(`/reviews/can-review/${productId}`).then((r) => r.data),
};
