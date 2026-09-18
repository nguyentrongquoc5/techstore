import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '../utils/format';
import EmptyState from '../components/common/EmptyState';
import type { Order } from '../types';

export default function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Order | null>(null);

  if (!isAuthenticated || !user) {
    navigate('/dang-nhap');
    return null;
  }

  const orders = orderService.getOrdersByUser(user.id);

  if (orders.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState title="Chưa có đơn hàng" description="Bạn chưa đặt đơn hàng nào." actionLabel="Mua sắm ngay" actionTo="/san-pham" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-3 text-sm">
                <span className="font-medium">{order.id}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-500">{formatDate(order.createdAt)}</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <img src={item.productImage} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <button onClick={() => setSelected(selected?.id === order.id ? null : order)} className="text-sm text-blue-600 hover:underline">
                  {selected?.id === order.id ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                </button>
                <p className="font-bold text-blue-600">{formatCurrency(order.total)}</p>
              </div>
              {selected?.id === order.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm space-y-1">
                  <p><span className="text-gray-500">Người nhận:</span> {order.shippingInfo.fullName} · {order.shippingInfo.phone}</p>
                  <p><span className="text-gray-500">Địa chỉ:</span> {order.shippingInfo.address}, {order.shippingInfo.district}, {order.shippingInfo.city}</p>
                  <p><span className="text-gray-500">Thanh toán:</span> {order.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản'}</p>
                  {order.shippingInfo.note && <p><span className="text-gray-500">Ghi chú:</span> {order.shippingInfo.note}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
