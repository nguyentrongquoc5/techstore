import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { ToastProvider } from './contexts/ToastContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { CompareProvider } from './contexts/CompareContext';
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
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AccountPage from './pages/AccountPage';
import OrdersPage from './pages/OrdersPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrderDetailPage from './pages/OrderDetailPage';
import WishlistPage from './pages/WishlistPage';
import NotFoundPage from './pages/NotFoundPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import PolicyPage from './pages/PolicyPage';
import ComparePage from './pages/ComparePage';
import PaymentReturnPage from './pages/PaymentReturnPage';

import DashboardPage from './pages/admin/DashboardPage';
import AdminProductsPage from './pages/admin/ProductsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import AdminOrdersPage from './pages/admin/OrdersPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminCategoriesPage from './pages/admin/CategoriesPage';
import AdminCouponsPage from './pages/admin/CouponsPage';
import AdminReviewsPage from './pages/admin/ReviewsPage';
import AdminContactsPage from './pages/admin/ContactsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <WishlistProvider>
            <CompareProvider>
            <Routes>
              <Route element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="san-pham" element={<ProductsPage />} />
                <Route path="san-pham/:id" element={<ProductDetailPage />} />
                <Route path="so-sanh" element={<ComparePage />} />
                <Route path="gio-hang" element={<CartPage />} />
                <Route path="thanh-toan" element={<CheckoutPage />} />
                <Route path="thanh-toan/ket-qua" element={<PaymentReturnPage />} />
                <Route path="dang-nhap" element={<LoginPage />} />
                <Route path="dang-ky" element={<RegisterPage />} />
                <Route path="quen-mat-khau" element={<ForgotPasswordPage />} />
                <Route path="dat-lai-mat-khau" element={<ResetPasswordPage />} />
                <Route path="tai-khoan" element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
                <Route path="don-hang" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                <Route path="don-hang/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                <Route path="dat-hang-thanh-cong/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
                <Route path="yeu-thich" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
                <Route path="gioi-thieu" element={<AboutPage />} />
                <Route path="lien-he" element={<ContactPage />} />
                <Route path="chinh-sach/:slug" element={<PolicyPage />} />
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
                <Route path="ma-giam-gia" element={<AdminCouponsPage />} />
                <Route path="danh-gia" element={<AdminReviewsPage />} />
                <Route path="lien-he" element={<AdminContactsPage />} />
              </Route>
            </Routes>
            </CompareProvider>
            </WishlistProvider>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
