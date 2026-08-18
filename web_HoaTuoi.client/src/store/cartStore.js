// src/store/cartStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

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

        const stockLimit = product.stock ?? 999;

        if (existing) {
          const newQty = existing.quantity + quantity;
          if (newQty > stockLimit) {
            toast.error(`Không thể thêm! Cửa hàng chỉ còn ${stockLimit} sản phẩm.`);
            return;
          }
          set({
            items: items.map(i =>
              i.productId === product.id
                ? { ...i, quantity: newQty }
                : i
            ),
          });
        } else {
          if (quantity > stockLimit) {
            toast.error(`Không thể thêm! Cửa hàng chỉ còn ${stockLimit} sản phẩm.`);
            return;
          }
          set({
            items: [...items, {
              productId: product.id,
              productName: product.name,
              mainImageUrl: product.mainImageUrl,
              unitPrice: effectivePrice,
              originalPrice: product.price,         // Giá gốc để hiển thị gạch ngang
              promotionalPrice: product.promotionalPrice ?? null,
              quantity,
              stock: stockLimit, // Save stock inside cart item for validation
            }],
          });
        }
      },

      updateQuantity: (productId, quantity) => {
        const items = get().items;
        const item = items.find(i => i.productId === productId);
        if (!item) return;

        if (quantity <= 0) {
          set({ items: items.filter(i => i.productId !== productId) });
        } else {
          const stockLimit = item.stock ?? 999;
          if (quantity > stockLimit) {
            toast.error(`Cửa hàng chỉ còn ${stockLimit} sản phẩm.`);
            // Cap it at stock limit
            set({ items: items.map(i => i.productId === productId ? { ...i, quantity: stockLimit } : i) });
          } else {
            set({ items: items.map(i => i.productId === productId ? { ...i, quantity } : i) });
          }
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
