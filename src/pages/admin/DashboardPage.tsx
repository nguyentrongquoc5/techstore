import { useEffect, useRef, useState } from 'react';
import { Package, ShoppingBag, Users, DollarSign, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { statsService } from '../../services/userService';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '../../utils/format';
import Loading from '../../components/common/Loading';
import { mediaUrl } from '../../services/api';
import type { Order } from '../../types';
import Pagination from '../../components/common/Pagination';
import { useToast } from '../../contexts/ToastContext';

const COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
const statusLabel: Record<string, string> = {
  pending: 'Chờ xác nhận', processing: 'Đang xử lý', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy',
};

export default function DashboardPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [reportError, setReportError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [orderSearchInput, setOrderSearchInput] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('');
  const [orderSort, setOrderSort] = useState('newest');
  const orderSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    statsService.dashboard().then(setData).catch(console.error);
  }, []);

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);
    const params: Record<string, string> = {
      page: String(ordersPage),
      limit: '8',
      sort: orderSort,
    };
    if (orderSearch.trim()) params.q = orderSearch.trim();
    if (orderStatus) params.status = orderStatus;
    orderService.getAllOrders(params)
      .then((result) => {
        if (!active) return;
        setRecentOrders(result.items);
        setOrdersTotal(result.total);
        setOrdersPage(result.page);
        setOrdersTotalPages(result.totalPages);
      })
      .catch((error: unknown) => {
        if (active) showToast(error instanceof Error ? error.message : 'Không tải được đơn hàng', 'error');
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ordersPage, orderSearch, orderStatus, orderSort, showToast]);

  useEffect(() => () => {
    if (orderSearchTimer.current) clearTimeout(orderSearchTimer.current);
  }, []);

  if (!data) return <Loading />;

  const stats = [
    { label: 'Tổng doanh thu', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'bg-blue-500' },
    { label: 'Tổng đơn hàng', value: data.totalOrders, icon: ShoppingBag, color: 'bg-green-500' },
    { label: 'Tổng sản phẩm', value: data.totalProducts, icon: Package, color: 'bg-purple-500' },
    { label: 'Tổng người dùng', value: data.totalUsers, icon: Users, color: 'bg-amber-500' },
  ];

  const pieData = (data.ordersByStatus || []).map((x: any) => ({ name: statusLabel[x.status] || x.status, value: x.count }));

  const downloadReport = async (type: 'orders' | 'revenue') => {
    setReportError('');
    setReportLoading(true);
    try {
      await statsService.downloadReport(type);
    } catch (error: unknown) {
      setReportError(error instanceof Error ? error.message : 'Không tải được báo cáo');
    } finally {
      setReportLoading(false);
    }
  };

  const onOrderSearchChange = (value: string) => {
    setOrderSearchInput(value);
    if (orderSearchTimer.current) clearTimeout(orderSearchTimer.current);
    orderSearchTimer.current = setTimeout(() => {
      setOrderSearch(value);
      setOrdersPage(1);
    }, 350);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          <button type="button" disabled={reportLoading} onClick={() => void downloadReport('orders')} className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm disabled:opacity-60">
            <FileDown size={16} /> Báo cáo đơn hàng
          </button>
          <button type="button" disabled={reportLoading} onClick={() => void downloadReport('revenue')} className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg text-sm disabled:opacity-60">
            <FileDown size={16} /> Doanh thu
          </button>
        </div>
      </div>
      {reportError && <p role="alert" className="text-sm text-red-600">{reportError}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center`}><s.icon size={22} className="text-white" /></div>
            <div>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Doanh thu theo tháng</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data.revenueByMonth || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => (v / 1e6).toFixed(0) + 'M'} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Đơn hàng theo trạng thái</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Sản phẩm bán chạy</h3>
          <div className="space-y-3">
            {(data.bestSellers || []).map((p: any) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={mediaUrl(p.images?.[0])} alt="" className="w-10 h-10 rounded object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.brand} · {p.soldQuantity} đã bán</p>
                </div>
                <span className="text-sm font-medium text-blue-600">{formatCurrency(p.salePrice ?? p.price)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Đơn hàng</h3>
            <span className="text-xs text-gray-500">{ordersTotal} đơn</span>
          </div>
          <div className="mb-3 grid gap-2 sm:grid-cols-2">
            <input
              type="search"
              value={orderSearchInput}
              onChange={(event) => onOrderSearchChange(event.target.value)}
              placeholder="Tìm tên, email, mã đơn..."
              aria-label="Tìm đơn hàng trên dashboard"
              className="min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <select aria-label="Lọc đơn hàng theo trạng thái" value={orderStatus} onChange={(event) => { setOrderStatus(event.target.value); setOrdersPage(1); }} className="min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">Tất cả trạng thái</option>
              {(['pending', 'processing', 'shipping', 'delivered', 'cancelled'] as const).map((status) => (
                <option key={status} value={status}>{getOrderStatusLabel(status)}</option>
              ))}
            </select>
            <select aria-label="Sắp xếp đơn hàng trên dashboard" value={orderSort} onChange={(event) => { setOrderSort(event.target.value); setOrdersPage(1); }} className="min-w-0 rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
              <option value="total-desc">Giá trị cao nhất</option>
              <option value="total-asc">Giá trị thấp nhất</option>
              <option value="customer-asc">Khách hàng A–Z</option>
              <option value="customer-desc">Khách hàng Z–A</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Khách</th><th className="pb-2">Tổng</th><th className="pb-2">TT</th><th className="pb-2">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr key={o.id} className="border-b border-gray-50">
                    <td className="py-2">{o.userName}</td>
                    <td className="py-2">{formatCurrency(o.total)}</td>
                    <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span></td>
                    <td className="py-2 text-gray-500">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
                {!ordersLoading && recentOrders.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-gray-500">Không tìm thấy đơn hàng.</td></tr>
                )}
                {ordersLoading && recentOrders.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-gray-500">Đang tải đơn hàng...</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination currentPage={ordersPage} totalPages={ordersTotalPages} onPageChange={setOrdersPage} />
        </div>
      </div>
    </div>
  );
}
