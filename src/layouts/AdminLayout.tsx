import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  TicketPercent,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ToastContainer from '../components/common/Toast';
import { usePageTitle } from '../hooks/usePageTitle';

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/san-pham', icon: Package, label: 'Sản phẩm' },
  { to: '/admin/don-hang', icon: ShoppingBag, label: 'Đơn hàng' },
  { to: '/admin/nguoi-dung', icon: Users, label: 'Người dùng' },
  { to: '/admin/danh-muc', icon: FolderTree, label: 'Danh mục' },
  { to: '/admin/ma-giam-gia', icon: TicketPercent, label: 'Mã giảm giá' },
  { to: '/admin/danh-gia', icon: MessageSquare, label: 'Đánh giá' },
  { to: '/admin/lien-he', icon: Mail, label: 'Liên hệ' },
];

export default function AdminLayout() {
  usePageTitle('Quản trị');
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navLimit, setNavLimit] = useState(() => {
    const stored = window.localStorage.getItem('admin-nav-limit');
    const value = stored ? Number(stored) : 6;
    return [6, 8].includes(value) ? value : 6;
  });
  const visibleNavItems = navItems.slice(0, navLimit);

  const handleNavLimitChange = (value: number) => {
    setNavLimit(value);
    window.localStorage.setItem('admin-nav-limit', String(value));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 h-screen sticky top-0 bg-slate-900 text-white flex-col shrink-0">
        <div className="p-5 border-b border-slate-700">
          <Link to="/admin/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="font-bold">T</span>
            </div>
            <span className="font-bold text-lg">TechStore Admin</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-700 space-y-2">
          <label className="flex items-center justify-between px-3 text-xs text-slate-300">
            <span>Số mục menu</span>
            <select
              aria-label="Số mục menu"
              value={navLimit}
              onChange={(event) => handleNavLimitChange(Number(event.target.value))}
              className="ml-2 border border-slate-600 rounded bg-slate-800 px-2 py-1 text-white"
            >
              <option value={6}>6</option>
              <option value={8}>Tất cả</option>
            </select>
          </label>
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-slate-800">
            <ChevronLeft size={18} /> Về trang chủ
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-slate-800 w-full"
          >
            <LogOut size={18} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-900 text-white flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-slate-700">
              <span className="font-bold">TechStore Admin</span>
              <button onClick={() => setSidebarOpen(false)}><X size={20} /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-blue-600' : 'text-gray-300 hover:bg-slate-800'
                    }`
                  }
                >
                  <item.icon size={18} />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-1.5 text-gray-600">
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-xs">{user?.fullName?.charAt(0)}</span>
            </div>
            <span className="hidden sm:block font-medium">{user?.fullName}</span>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
