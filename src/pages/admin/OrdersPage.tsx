import { useEffect, useState } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '../../utils/format';
import type { Order, OrderStatus } from '../../types';
import Loading from '../../components/common/Loading';

const statuses: OrderStatus[] = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    orderService.getAllOrders().then(setOrders).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleStatus = async (id: string, status: OrderStatus) => {
    try {
      const updated = await orderService.updateStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      if (selected?.id === id) setSelected(updated);
      showToast('Cập nhật trạng thái thành công', 'success');
    } catch (e: any) {
      showToast(e.message || 'Lỗi', 'error');
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b">
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Tổng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-b border-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{o.userName}</p>
                  <p className="text-xs text-gray-400">{o.userEmail}</p>
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={(e) => handleStatus(o.id, e.target.value as OrderStatus)} className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${getOrderStatusColor(o.status)}`}>
                    {statuses.map((s) => (
                      <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
                <td className="px-4 py-3">
                  <button onClick={() => setSelected(selected?.id === o.id ? null : o)} className="text-blue-600 text-xs hover:underline">Chi tiết</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="bg-white rounded-xl border p-5 text-sm">
          <h3 className="font-semibold mb-2">Chi tiết đơn</h3>
          <p>{selected.shippingInfo?.fullName} · {selected.shippingInfo?.phone}</p>
          <p className="text-gray-500 mb-3">{selected.shippingInfo?.address}, {selected.shippingInfo?.district}, {selected.shippingInfo?.city}</p>
          {(selected.items || []).map((item, i) => (
            <div key={i} className="flex justify-between py-1">
              <span>{item.productName} x{item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <p className="text-right font-bold text-blue-600 mt-2">{formatCurrency(selected.total)}</p>
        </div>
      )}
    </div>
  );
}
