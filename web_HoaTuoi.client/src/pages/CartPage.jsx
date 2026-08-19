// Hợp phần hiển thị danh sách sản phẩm trong giỏ hàng và tiến hành đặt hàng
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../store/cartStore';
import { formatVnd } from '../utils/format';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { resolveImage } from '../utils/imageResolver';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem } = useCartStore();

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const finalAmount = subtotal;

  if (items.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <ShoppingCart size={64} className="mx-auto text-gray-200 mb-4" />
      <h2 className="text-xl font-bold text-gray-700 mb-2">Giỏ hàng trống</h2>
      <p className="text-gray-400 mb-6">Hãy thêm sản phẩm vào giỏ hàng!</p>
      <Link to="/hoa" className="btn-primary">Tiếp tục mua sắm</Link>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Giỏ hàng ({items.length})</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Danh sách các mặt hàng trong giỏ */}
        <div className="md:col-span-2 space-y-3">
          {items.map(item => (
            <div key={item.productId} className="bg-white rounded-2xl p-4 border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <img src={resolveImage(item.mainImageUrl)} alt={item.productName}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover bg-gray-50 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-2">{item.productName}</p>
                  <p className="text-pink-600 font-bold mt-1 text-xs sm:text-sm">{formatVnd(item.unitPrice)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.stock || 999}
                    value={item.quantity}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val <= 0) {
                        // Allow empty input temporarily but fallback on blur
                      } else {
                        updateQuantity(item.productId, val);
                      }
                    }}
                    onBlur={e => {
                      const val = parseInt(e.target.value, 10);
                      if (isNaN(val) || val <= 0) {
                        updateQuantity(item.productId, 1);
                      }
                    }}
                    className="w-12 text-center text-sm font-semibold border-x border-y-0 border-gray-150 focus:outline-none focus:ring-0 p-0 h-9 bg-transparent"
                  />
                  <button 
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    disabled={item.quantity >= (item.stock || 999)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-right flex sm:flex-col items-center sm:items-end gap-3 sm:gap-0">
                  <p className="text-sm font-bold text-gray-900">{formatVnd(item.unitPrice * item.quantity)}</p>
                  <button onClick={() => removeItem(item.productId)}
                    className="sm:mt-1 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tóm tắt giá trị đơn hàng và nút thanh toán */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
            <h2 className="font-bold text-gray-900">Tóm tắt đơn hàng</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span><span>{formatVnd(subtotal)}</span>
              </div>
              <div className="flex justify-between font-bold text-gray-900 text-base border-t pt-2">
                <span>Tổng cộng</span><span className="text-pink-600">{formatVnd(finalAmount)}</span>
              </div>
            </div>

            <button onClick={() => navigate('/thanh-toan', { state: { finalAmount } })}
              className="btn-primary w-full flex items-center justify-center gap-2">
              Tiến hành thanh toán <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
