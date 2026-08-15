// src/types/order.ts

export type OrderStatus =
  | 'Pending'
  | 'Processing'
  | 'Shipping'
  | 'Completed'
  | 'Cancelled'
  | 'Refunded';

export type OrderType = 'Retail' | 'DesignDeposit';

export interface CartItem {
  productId: number;
  productName: string;
  mainImageUrl: string;
  unitPrice: number;
  quantity: number;
}

export interface CreateOrderPayload {
  type: OrderType;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  items: CartItem[];
}

export interface OrderSummary {
  id: number;
  orderCode: string;
  status: OrderStatus;
  finalAmount: number;
  isPaid: boolean;
  createdAt: string;
  items: CartItem[];
}

export interface OrderDetail extends OrderSummary {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  totalAmount: number;
  vnpayTransactionId?: string;
  items: CartItem[];
}
