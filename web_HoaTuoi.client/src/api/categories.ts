// src/api/categories.ts
import apiClient from './client';

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  icon?: string;
  sortOrder: number;
  productCount: number;
}

export const categoryApi = {
  getAll: () =>
    apiClient.get<CategoryDto[]>('/categories').then((r) => r.data),

  getBySlug: (slug: string) =>
    apiClient.get<CategoryDto>(`/categories/${slug}`).then((r) => r.data),

  getActiveFilters: () =>
    apiClient.get<{ flowerTypes: string[], occasions: string[] }>('/categories/filters').then((r) => r.data),
};
