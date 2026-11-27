import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { orderService } from '../services/orderService';
import { useToast } from '../contexts/ToastContext';
import { formatCurrency, formatDate, formatOrderCode, getOrderStatusLabel, getOrderStatusColor } from '../utils/format';
import EmptyState from '../components/common/EmptyState';
import Loading from '../components/common/Loading';
import { mediaUrl } from '../services/api';
import type { Order } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

export default function OrdersPage() {
  usePageTitle('Đơn hàng của tôi');
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/dang-nhap');
      return;
    }
    orderService
      .getMyOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  if (loading) return <Loading />;
  if (!orders.length) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <EmptyState title="Chưa có đơn hàng" actionLabel="Mua sắm ngay" actionTo="/san-pham" />
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
                <span className="font-medium">{formatOrderCode(order.id)}</span>
                <span className="text-gray-500">{formatDate(order.createdAt)}</span>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getOrderStatusColor(order.status)}`}>
                {getOrderStatusLabel(order.status)}
              </span>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <img src={mediaUrl(item.productImage)} alt="" className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-gray-500">x{item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelected(selected?.id === order.id ? null : order)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {selected?.id === order.id ? 'Ẩn nhanh' : 'Xem nhanh'}
                  </button>
                  <Link to={`/don-hang/${order.id}`} className="text-sm text-blue-600 hover:underline font-medium">
                    Xem chi tiết
                  </Link>
                </div>
                <p className="font-bold text-blue-600">{formatCurrency(order.total)}</p>
              </div>
              {selected?.id === order.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm space-y-1">
                  <p><span className="text-gray-500">Người nhận:</span> {order.shippingInfo?.fullName} · {order.shippingInfo?.phone}</p>
                  <p><span className="text-gray-500">Địa chỉ:</span> {order.shippingInfo?.address}, {order.shippingInfo?.district}, {order.shippingInfo?.city}</p>
                  <p><span className="text-gray-500">Thanh toán:</span> {order.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản'}</p>
                  {(order.statusLogs?.length ?? 0) > 0 && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <p className="text-gray-500 mb-1">Lịch sử trạng thái</p>
                      <ol className="space-y-1">
                        {order.statusLogs!.map((log) => (
                          <li key={log.id} className="flex gap-2 text-xs">
                            <span className={`px-2 py-0.5 rounded-full ${getOrderStatusColor(log.status)}`}>{getOrderStatusLabel(log.status)}</span>
                            <span className="text-gray-400">{formatDate(log.createdAt)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {['pending', 'processing'].includes(order.status) && (
                    <button
                      type="button"
                      className="mt-3 text-sm text-red-600 hover:underline"
                      onClick={async () => {
                        if (!confirm('Hủy đơn hàng này?')) return;
                        try {
                          const updated = await orderService.cancelOrder(order.id);
                          setOrders((previous) => previous.map((item) => item.id === order.id ? updated : item));
                          setSelected(updated);
                          showToast('Đã hủy đơn hàng', 'success');
                        } catch (error: unknown) {
                          showToast(error instanceof Error ? error.message : 'Hủy đơn thất bại', 'error');
                        }
                      }}
                    >Hủy đơn hàng</button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
