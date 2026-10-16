import { useEffect, useState } from 'react';
import { Package, ShoppingBag, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { statsService } from '../../services/userService';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '../../utils/format';
import Loading from '../../components/common/Loading';
import { mediaUrl } from '../../services/api';

const COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];
const statusLabel: Record<string, string> = {
  pending: 'Chờ xác nhận', processing: 'Đang xử lý', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy',
};

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    statsService.dashboard().then(setData).catch(console.error);
  }, []);

  if (!data) return <Loading />;

  const stats = [
    { label: 'Tổng doanh thu', value: formatCurrency(data.totalRevenue), icon: DollarSign, color: 'bg-blue-500' },
    { label: 'Tổng đơn hàng', value: data.totalOrders, icon: ShoppingBag, color: 'bg-green-500' },
    { label: 'Tổng sản phẩm', value: data.totalProducts, icon: Package, color: 'bg-purple-500' },
    { label: 'Tổng người dùng', value: data.totalUsers, icon: Users, color: 'bg-amber-500' },
  ];

  const pieData = (data.ordersByStatus || []).map((x: any) => ({ name: statusLabel[x.status] || x.status, value: x.count }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
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
                  <p className="text-xs text-gray-500">{p.brand}</p>
                </div>
                <span className="text-sm font-medium text-blue-600">{formatCurrency(p.salePrice ?? p.price)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold mb-4">Đơn hàng gần đây</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">Khách</th><th className="pb-2">Tổng</th><th className="pb-2">TT</th><th className="pb-2">Ngày</th>
                </tr>
              </thead>
              <tbody>
                {(data.recentOrders || []).map((o: any) => (
                  <tr key={o.id} className="border-b border-gray-50">
                    <td className="py-2">{o.userName}</td>
                    <td className="py-2">{formatCurrency(o.total)}</td>
                    <td className="py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusColor(o.status)}`}>{getOrderStatusLabel(o.status)}</span></td>
                    <td className="py-2 text-gray-500">{formatDate(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
