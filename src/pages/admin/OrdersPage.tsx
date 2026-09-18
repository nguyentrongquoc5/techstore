import { useState } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '../../utils/format';
import type { Order, OrderStatus } from '../../types';

const statuses: OrderStatus[] = ['pending', 'processing', 'shipping', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState(orderService.getOrders());
  const [selected, setSelected] = useState<Order | null>(null);

  const handleStatus = (id: string, status: OrderStatus) => {
    orderService.updateStatus(id, status);
    setOrders(orderService.getOrders());
    if (selected?.id === id) setSelected(orderService.getOrderById(id) || null);
    showToast('Cập nhật trạng thái thành công', 'success');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 bg-gray-50 border-b">
                <th className="px-4 py-3 font-medium">Mã đơn</th>
                <th className="px-4 py-3 font-medium">Khách hàng</th>
                <th className="px-4 py-3 font-medium">Tổng tiền</th>
                <th className="px-4 py-3 font-medium">Trạng thái</th>
                <th className="px-4 py-3 font-medium">Ngày</th>
                <th className="px-4 py-3 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{o.id}</td>
                  <td className="px-4 py-3">
                    <p>{o.userName}</p>
                    <p className="text-xs text-gray-400">{o.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(o.total)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={o.status}
                      onChange={(e) => handleStatus(o.id, e.target.value as OrderStatus)}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${getOrderStatusColor(o.status)}`}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{getOrderStatusLabel(s)}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(selected?.id === o.id ? null : o)} className="text-blue-600 text-xs hover:underline">
                      {selected?.id === o.id ? 'Ẩn' : 'Chi tiết'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-3">Chi tiết đơn {selected.id}</h3>
          <div className="grid sm:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-500">Người nhận</p>
              <p className="font-medium">{selected.shippingInfo.fullName} · {selected.shippingInfo.phone}</p>
              <p>{selected.shippingInfo.address}, {selected.shippingInfo.district}, {selected.shippingInfo.city}</p>
            </div>
            <div>
              <p className="text-gray-500">Thanh toán</p>
              <p className="font-medium">{selected.paymentMethod === 'cod' ? 'COD' : 'Chuyển khoản'}</p>
              <p>Phí ship: {formatCurrency(selected.shippingFee)}</p>
            </div>
          </div>
          <div className="space-y-2">
            {selected.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <img src={item.productImage} alt="" className="w-10 h-10 rounded object-cover" />
                <span className="flex-1">{item.productName} x{item.quantity}</span>
                <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <p className="text-right font-bold text-blue-600 mt-3">Tổng: {formatCurrency(selected.total)}</p>
        </div>
      )}
    </div>
  );
}
