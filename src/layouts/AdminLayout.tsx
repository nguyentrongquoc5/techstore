import { useState } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  FolderTree,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
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
    return Number.isSafeInteger(value) && value >= 1 && value <= navItems.length ? value : 6;
  });
  const [visibleMenuItems, setVisibleMenuItems] = useState<string[]>(() => {
    const stored = window.localStorage.getItem('admin-nav-visible-items');
    if (!stored) return navItems.slice(1).map((item) => item.to);
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (path): path is string =>
            typeof path === 'string' && navItems.slice(1).some((item) => item.to === path)
        );
      }
    } catch {
      return navItems.slice(1).map((item) => item.to);
    }
    return navItems.slice(1).map((item) => item.to);
  });
  const [menuOrder, setMenuOrder] = useState<string[]>(() => {
    const defaultOrder = navItems.slice(1).map((item) => item.to);
    const stored = window.localStorage.getItem('admin-nav-order');
    if (!stored) return defaultOrder;
    try {
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const validOrder = parsed.filter(
          (path): path is string =>
            typeof path === 'string' &&
            defaultOrder.includes(path) &&
            parsed.indexOf(path) === parsed.lastIndexOf(path)
        );
        return [...validOrder, ...defaultOrder.filter((path) => !validOrder.includes(path))];
      }
    } catch {
      return defaultOrder;
    }
    return defaultOrder;
  });
  const orderedMenuItems = menuOrder.flatMap((path) => {
    const item = navItems.find((navItem) => navItem.to === path);
    return item && item.to !== navItems[0].to ? [item] : [];
  });
  const visibleNavItems = [
    navItems[0],
    ...orderedMenuItems.filter((item) => visibleMenuItems.includes(item.to)),
  ].slice(0, navLimit);

  const handleNavLimitChange = (value: number) => {
    setNavLimit(value);
    window.localStorage.setItem('admin-nav-limit', String(value));
  };

  const handleMenuVisibilityChange = (path: string, visible: boolean) => {
    const updatedItems = visible
      ? [...visibleMenuItems, path]
      : visibleMenuItems.filter((item) => item !== path);
    setVisibleMenuItems(updatedItems);
    window.localStorage.setItem('admin-nav-visible-items', JSON.stringify(updatedItems));
  };

  const handleMenuReorder = (path: string, direction: -1 | 1) => {
    const currentIndex = menuOrder.indexOf(path);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= menuOrder.length) return;

    const updatedOrder = [...menuOrder];
    [updatedOrder[currentIndex], updatedOrder[nextIndex]] = [
      updatedOrder[nextIndex],
      updatedOrder[currentIndex],
    ];
    setMenuOrder(updatedOrder);
    window.localStorage.setItem('admin-nav-order', JSON.stringify(updatedOrder));
  };

  const renderMenuSettings = () => (
    <details className="mt-3 border-t border-slate-700 pt-3">
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-300">
        Tùy chỉnh menu
      </summary>
      <div className="space-y-2 px-3 pb-2">
        <label className="flex items-center justify-between text-xs text-slate-300">
          <span>Số mục menu</span>
          <select
            aria-label="Số mục menu"
            value={navLimit}
            onChange={(event) => handleNavLimitChange(Number(event.target.value))}
            className="ml-2 border border-slate-600 rounded bg-slate-800 px-2 py-1 text-white"
          >
            {navItems.map((_, index) => {
              const count = index + 1;
              return <option key={count} value={count}>{count === navItems.length ? 'Tất cả' : count}</option>;
            })}
          </select>
        </label>
        <div className="space-y-1">
          {orderedMenuItems.map((item, index) => (
            <div key={item.to} className="flex items-center justify-between gap-2 text-xs text-slate-300">
              <label className="flex min-w-0 items-center gap-2">
                <input
                  type="checkbox"
                  aria-label={`Hiển thị mục ${item.label}`}
                  checked={visibleMenuItems.includes(item.to)}
                  onChange={(event) => handleMenuVisibilityChange(item.to, event.target.checked)}
                  className="accent-blue-500"
                />
                <span>{item.label}</span>
              </label>
              <div className="flex shrink-0">
                <button
                  type="button"
                  aria-label={`Di chuyển ${item.label} lên`}
                  title={`Di chuyển ${item.label} lên`}
                  disabled={index === 0}
                  onClick={() => handleMenuReorder(item.to, -1)}
                  className="rounded p-1 text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  aria-label={`Di chuyển ${item.label} xuống`}
                  title={`Di chuyển ${item.label} xuống`}
                  disabled={index === orderedMenuItems.length - 1}
                  onClick={() => handleMenuReorder(item.to, 1)}
                  className="rounded p-1 text-slate-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </details>
  );

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
          {renderMenuSettings()}
        </nav>
        <div className="p-3 border-t border-slate-700 space-y-2">
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
              {renderMenuSettings()}
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
