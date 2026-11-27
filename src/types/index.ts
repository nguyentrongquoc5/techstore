export type Role = 'USER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  avatar?: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  district: string;
  city: string;
  isDefault: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  productCount?: number;
}

export interface ProductVariant {
  id: string;
  color: string;
  configuration: string;
  sku: string;
  price: number | null;
  stock: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  price: number;
  salePrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  description: string;
  specs: Record<string, string> | any;
  images: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  status: 'active' | 'inactive';
  createdAt: string;
  variants?: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}

export interface OrderItem {
  productId: string;
  variantId?: string;
  variantName?: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipping' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: 'cod' | 'transfer' | 'vnpay' | 'momo';
  paymentStatus: 'unpaid' | 'paid';
  paidAt?: string | null;
  couponCode?: string | null;
  shippingInfo: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    district: string;
    note?: string;
  };
  createdAt: string;
  updatedAt: string;
  statusLogs?: OrderStatusLog[];
  emailSent?: boolean;
}

export interface OrderStatusLog {
  id: string;
  status: string;
  changedBy: string;
  createdAt: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ReviewListResponse {
  items: Review[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  rating: number;
  reviewCount: number;
}
