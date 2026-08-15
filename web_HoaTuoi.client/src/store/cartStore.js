// src/store/cartStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [], // CartItem[]

      addItem: (product, quantity = 1) => {
        const items = get().items;
        const existing = items.find(i => i.productId === product.id);
        // Ưu tiên: Flash Sale price > salePrice > price
        const effectivePrice = product.promotionalPrice
          ?? (product.salePrice ?? product.price);

        if (existing) {
          set({
            items: items.map(i =>
              i.productId === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({
            items: [...items, {
              productId: product.id,
              productName: product.name,
              mainImageUrl: product.mainImageUrl,
              unitPrice: effectivePrice,
              originalPrice: product.price,         // Giá gốc để hiển thị gạch ngang
              promotionalPrice: product.promotionalPrice ?? null,
              quantity,
            }],
          });
        }
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          set({ items: get().items.filter(i => i.productId !== productId) });
        } else {
          set({ items: get().items.map(i => i.productId === productId ? { ...i, quantity } : i) });
        }
      },

      removeItem: (productId) =>
        set({ items: get().items.filter(i => i.productId !== productId) }),

      clearCart: () => set({ items: [] }),

      get totalItems() { return get().items.reduce((s, i) => s + i.quantity, 0); },
      get totalPrice() { return get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0); },
    }),
    { name: 'hoatuoi-cart' }
  )
);
