import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { formatCurrency } from '../utils/format';
import EmptyState from '../components/common/EmptyState';

export default function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const shipping = subtotal > 5000000 || subtotal === 0 ? 0 : 30000;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState
          title="Giỏ hàng trống"
          description="Bạn chưa có sản phẩm nào trong giỏ hàng."
          actionLabel="Mua sắm ngay"
          actionTo="/san-pham"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Giỏ hàng ({items.length})</h1>
        <button onClick={clearCart} className="text-sm text-red-600 hover:underline flex items-center gap-1">
          <Trash2 size={14} /> Xóa tất cả
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => {
            const price = item.product.salePrice ?? item.product.price;
            return (
              <div key={item.productId} className="bg-white rounded-xl border border-gray-100 p-4 flex gap-4">
                <Link to={`/san-pham/${item.productId}`} className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/san-pham/${item.productId}`} className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2 text-sm sm:text-base">
                    {item.product.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-0.5">{item.product.brand}</p>
                  <p className="text-blue-600 font-semibold mt-1">{formatCurrency(price)}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center border border-gray-200 rounded-lg">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="p-1.5 hover:bg-gray-50">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="p-1.5 hover:bg-gray-50">
                        <Plus size={14} />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.productId)} className="p-1.5 text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="hidden sm:block text-right shrink-0">
                  <p className="font-semibold text-gray-900">{formatCurrency(price * item.quantity)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
            <h3 className="font-semibold mb-4">Tóm tắt đơn hàng</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Tạm tính</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phí vận chuyển</span>
                <span>{shipping === 0 ? 'Miễn phí' : formatCurrency(shipping)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-base font-bold">
                <span>Tổng cộng</span>
                <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
            </div>
            <Link
              to="/thanh-toan"
              className="mt-5 w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              <ShoppingBag size={18} /> Thanh toán
            </Link>
            <Link to="/san-pham" className="mt-2 w-full block text-center py-2 text-sm text-blue-600 hover:underline">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
