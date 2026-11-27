import { useCallback, useEffect, useRef, useState } from 'react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../contexts/ToastContext';
import {
  formatCurrency,
  formatDate,
  formatOrderCode,
  getAllowedNextStatuses,
  getOrderStatusLabel,
  getOrderStatusColor,
} from '../../utils/format';
import type { Order, OrderStatus } from '../../types';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import PageSizeSelect from '../../components/common/PageSizeSelect';
import { usePageSize } from '../../hooks/usePageSize';

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [perPage, setPerPage] = usePageSize('admin-orders-page-size');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback((nextPage = 1, nextStatus = statusFilter, nextQ = q) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(nextPage), limit: String(perPage), sort };
    if (nextStatus) params.status = nextStatus;
    if (nextQ.trim()) params.q = nextQ.trim();
    if (paymentStatusFilter) params.paymentStatus = paymentStatusFilter;
    if (paymentMethodFilter) params.paymentMethod = paymentMethodFilter;

    orderService.getAllOrders(params)
      .then((result) => {
        setOrders(result.items);
        setPage(result.page);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      })
      .catch((e: unknown) => {
        console.error(e);
        showToast(e instanceof Error ? e.message : 'Không tải được đơn hàng', 'error');
      })
      .finally(() => {
        setLoading(false);
        setHasLoaded(true);
      });
  }, [q, showToast, statusFilter, paymentStatusFilter, paymentMethodFilter, sort, perPage]);

  useEffect(() => {
    load(1, statusFilter, q);
  }, [load, q, statusFilter, paymentStatusFilter, paymentMethodFilter, sort]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const onSearchChange = (value: string) => {
    setQInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQ(value);
      setPage(1);
    }, 400);
  };

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

  const handlePayment = async (id: string, paymentStatus: 'paid' | 'unpaid') => {
    try {
      const updated = await orderService.updatePayment(id, paymentStatus);
      setOrders((prev) => prev.map((order) => order.id === id ? updated : order));
      if (selected?.id === id) setSelected(updated);
      showToast('Cập nhật thanh toán thành công', 'success');
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Không thể cập nhật thanh toán', 'error');
    }
  };

  if (loading && orders.length === 0 && !hasLoaded) return <Loading />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <input
          type="search"
          value={qInput}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm theo tên, email hoặc mã đơn..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm min-w-[180px]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="pending">{getOrderStatusLabel('pending')}</option>
          <option value="processing">{getOrderStatusLabel('processing')}</option>
          <option value="shipping">{getOrderStatusLabel('shipping')}</option>
          <option value="delivered">{getOrderStatusLabel('delivered')}</option>
          <option value="cancelled">{getOrderStatusLabel('cancelled')}</option>
        </select>
        <select
          aria-label="Lọc trạng thái thanh toán"
          value={paymentStatusFilter}
          onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tất cả thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="unpaid">Chưa thanh toán</option>
        </select>
        <select
          aria-label="Lọc phương thức thanh toán"
          value={paymentMethodFilter}
          onChange={(e) => { setPaymentMethodFilter(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Tất cả phương thức</option>
          <option value="cod">COD</option>
          <option value="transfer">Chuyển khoản</option>
          <option value="vnpay">VNPay</option>
          <option value="momo">MoMo</option>
        </select>
        <select
          aria-label="Sắp xếp đơn hàng"
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="total-desc">Giá trị cao nhất</option>
          <option value="total-asc">Giá trị thấp nhất</option>
          <option value="customer-asc">Khách hàng A–Z</option>
          <option value="customer-desc">Khách hàng Z–A</option>
        </select>
      </div>
      <p className="text-sm text-gray-500">{total} đơn hàng</p>
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 bg-gray-50 border-b">
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Tổng</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Thanh toán</th>
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
                  <p className="text-xs text-gray-400 mt-0.5">{formatOrderCode(o.id)}</p>
                </td>
                <td className="px-4 py-3 font-medium">{formatCurrency(o.total)}</td>
                <td className="px-4 py-3">
                  {(() => {
                    const nextStatuses = getAllowedNextStatuses(o.status);
                    const locked = nextStatuses.length === 0;
                    const options = locked ? [o.status] : [o.status, ...nextStatuses];
                    return (
                      <select
                        value={o.status}
                        disabled={locked}
                        onChange={(e) => handleStatus(o.id, e.target.value as OrderStatus)}
                        className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${getOrderStatusColor(o.status)} ${locked ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {options.map((status) => (
                          <option key={status} value={status}>{getOrderStatusLabel(status)}</option>
                        ))}
                      </select>
                    );
                  })()}
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={o.status === 'cancelled'}
                    onClick={() => handlePayment(o.id, o.paymentStatus === 'paid' ? 'unpaid' : 'paid')}
                    className={`text-xs px-2 py-1 rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                      o.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                    title={o.status === 'cancelled' ? 'Đơn đã hủy' : 'Nhấn để đổi trạng thái thanh toán'}
                  >
                    {o.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </button>
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
      <div className="flex justify-end">
        <PageSizeSelect
          value={perPage}
          onChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
        />
      </div>
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={(nextPage) => load(nextPage, statusFilter, q)}
      />
      {selected && (
        <div className="bg-white rounded-xl border p-5 text-sm">
          <h3 className="font-semibold mb-2">Chi tiết đơn</h3>
          <p>{selected.shippingInfo?.fullName} · {selected.shippingInfo?.phone}</p>
          <p className="text-gray-500 mb-3">{selected.shippingInfo?.address}, {selected.shippingInfo?.district}, {selected.shippingInfo?.city}</p>
          <p className="text-gray-600 mb-3">
            Thanh toán: {{
              cod: 'COD',
              transfer: 'Chuyển khoản ngân hàng',
              vnpay: 'VNPay',
              momo: 'MoMo',
            }[selected.paymentMethod]} ·{' '}
            {selected.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
            {selected.paidAt ? ` lúc ${formatDate(selected.paidAt)}` : ''}
          </p>
          {(selected.items || []).map((item, i) => (
            <div key={i} className="flex justify-between py-1">
              <span>{item.productName} x{item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <p className="text-right font-bold text-blue-600 mt-2">{formatCurrency(selected.total)}</p>
          {(selected.statusLogs?.length ?? 0) > 0 && (
            <div className="mt-4 border-t pt-3">
              <h4 className="font-medium mb-2">Lịch sử trạng thái</h4>
              <ol className="space-y-2">
                {selected.statusLogs!.map((log) => (
                  <li key={log.id} className="flex gap-2 text-xs text-gray-600">
                    <span className={`px-2 py-0.5 rounded-full ${getOrderStatusColor(log.status)}`}>{getOrderStatusLabel(log.status)}</span>
                    <span>{formatDate(log.createdAt)}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
