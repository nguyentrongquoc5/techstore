import { useMemo } from 'react';
import { Package, ShoppingBag, Users, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { productService } from '../../services/productService';
import { orderService } from '../../services/orderService';
import { authService } from '../../services/authService';
import { formatCurrency, formatDate, getOrderStatusLabel, getOrderStatusColor } from '../../utils/format';

const COLORS = ['#2563eb', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#10b981'];

export default function DashboardPage() {
  const products = productService.getAll();
  const orders = orderService.getOrders();
  const users = authService.getUsers();
  const categories = productService.getCategories();

  const totalRevenue = orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalUsers = users.length;

  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    orders.filter((o) => o.status !== 'cancelled').forEach((o) => {
      const m = o.createdAt.slice(0, 7);
      map[m] = (map[m] || 0) + o.total;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).map(([month, revenue]) => ({
      month: month.slice(5) + '/' + month.slice(0, 4),
      revenue,
    }));
  }, [orders]);

  const ordersByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach((o) => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([status, count]) => ({
      name: getOrderStatusLabel(status),
      value: count,
    }));
  }, [orders]);

  const categoryStats = useMemo(() => {
    return categories.map((c) => ({
      name: c.name,
      count: products.filter((p) => p.categoryId === c.id).length,
    })).filter((c) => c.count > 0);
  }, [categories, products]);

  const bestSellers = products.filter((p) => p.isBestSeller).slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  const stats = [
    { label: 'Tổng doanh thu', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-blue-500' },
    { label: 'Tổng đơn hàng', value: totalOrders, icon: ShoppingBag, color: 'bg-green-500' },
    { label: 'Tổng sản phẩm', value: totalProducts, icon: Package, color: 'bg-purple-500' },
    { label: 'Tổng người dùng', value: totalUsers, icon: Users, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${s.color} rounded-xl flex items-center justify-center`}>
              <s.icon size={22} className="text-white" />
            </div>
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
            <BarChart data={revenueByMonth}>
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
              <Pie data={ordersByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                {ordersByStatus.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
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
            {bestSellers.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover" />
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
          <h3 className="font-semibold mb-4">Thống kê danh mục</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryStats} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#06b6d4" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h3 className="font-semibold mb-4">Đơn hàng gần đây</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="pb-2 font-medium">Mã đơn</th>
                <th className="pb-2 font-medium">Khách hàng</th>
                <th className="pb-2 font-medium">Tổng tiền</th>
                <th className="pb-2 font-medium">Trạng thái</th>
                <th className="pb-2 font-medium">Ngày</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50">
                  <td className="py-2.5 font-medium">{o.id}</td>
                  <td className="py-2.5">{o.userName}</td>
                  <td className="py-2.5">{formatCurrency(o.total)}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getOrderStatusColor(o.status)}`}>
                      {getOrderStatusLabel(o.status)}
                    </span>
                  </td>
                  <td className="py-2.5 text-gray-500">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
