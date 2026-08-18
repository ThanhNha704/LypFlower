// src/api/products.ts
import apiClient from './client';
import type { PaginatedProducts, ProductDetail, ProductFilterParams } from '../types/product';

export const productApi = {
  /** Lấy danh sách sản phẩm với filter + paging */
  getProducts: (params: ProductFilterParams) =>
    apiClient.get<PaginatedProducts>('/products', { params }).then((r) => r.data),

  /** Chi tiết sản phẩm theo slug */
  getProductBySlug: (slug: string) =>
    apiClient.get<ProductDetail>(`/products/${slug}`).then((r) => r.data),

  /** Tìm kiếm gợi ý (auto-suggest) */
  search: (keyword: string) =>
    apiClient
      .get<{ id: number; name: string; slug: string; mainImageUrl: string }[]>(
        '/products/search',
        { params: { q: keyword } }
      )
      .then((r) => r.data),
};
