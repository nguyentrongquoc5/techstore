import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';

import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AccountPage from './pages/AccountPage';
import OrdersPage from './pages/OrdersPage';
import NotFoundPage from './pages/NotFoundPage';

import DashboardPage from './pages/admin/DashboardPage';
import AdminProductsPage from './pages/admin/ProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminCategoriesPage from './pages/admin/CategoriesPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="san-pham" element={<ProductsPage />} />
                <Route path="san-pham/:id" element={<ProductDetailPage />} />
                <Route path="gio-hang" element={<CartPage />} />
                <Route path="thanh-toan" element={<CheckoutPage />} />
                <Route path="dang-nhap" element={<LoginPage />} />
                <Route path="dang-ky" element={<RegisterPage />} />
                <Route path="tai-khoan" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                <Route path="don-hang" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>

              <Route path="admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="san-pham" element={<AdminProductsPage />} />
                <Route path="san-pham/them" element={<ProductFormPage />} />
                <Route path="san-pham/:id" element={<ProductFormPage />} />
                <Route path="don-hang" element={<AdminOrdersPage />} />
                <Route path="nguoi-dung" element={<AdminUsersPage />} />
                <Route path="danh-muc" element={<AdminCategoriesPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
