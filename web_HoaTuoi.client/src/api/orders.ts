// src/api/orders.ts
import apiClient from './client';
import type { CreateOrderPayload, OrderDetail, OrderSummary } from '../types/order';

export const orderApi = {
  createOrder: (payload: CreateOrderPayload) =>
    apiClient
  .post<{ orderSummary: OrderSummary; paymentUrl?: string }>('/orders', payload)
      .then((r) => r.data),

  getMyOrders: () =>
    apiClient.get<OrderSummary[]>('/orders/my').then((r) => r.data),

  getOrder: (id: number) =>
    apiClient.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),

  cancelOrder: (id: number) =>
    apiClient.put<{ message: string }>(`/orders/${id}/cancel`).then((r) => r.data),

  // Admin
  getAllOrders: (page = 1, pageSize = 20, status?: string) =>
 apiClient
      .get<{ total: number; page: number; items: any[] }>('/orders', {
        params: { page, pageSize, status },
 })
      .then((r) => r.data),

  updateStatus: (id: number, status: string) =>
    apiClient.put(`/orders/${id}/status`, { status }).then((r) => r.data),
};
