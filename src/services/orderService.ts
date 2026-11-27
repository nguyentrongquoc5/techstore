import { api } from './api';
import type { Order, CartItem, OrderItem, Paginated } from '../types';

const CART_KEY = 'techstore_cart';

export const orderService = {
  getCart(): CartItem[] {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch {
      return [];
    }
  },

  setCart(items: CartItem[]) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  },

  addToCart(productId: string, quantity = 1, variantId?: string) {
    const cart = this.getCart();
    const existing = cart.find((i) => i.productId === productId && i.variantId === variantId);
    if (existing) existing.quantity += quantity;
    else cart.push({ productId, variantId, quantity });
    this.setCart(cart);
    return cart;
  },

  updateCartQuantity(productId: string, quantity: number, variantId?: string) {
    let cart = this.getCart();
    if (quantity <= 0) cart = cart.filter((i) => !(i.productId === productId && i.variantId === variantId));
    else {
      const item = cart.find((i) => i.productId === productId && i.variantId === variantId);
      if (item) item.quantity = quantity;
    }
    this.setCart(cart);
    return cart;
  },

  removeFromCart(productId: string, variantId?: string) {
    const cart = this.getCart().filter((i) => !(i.productId === productId && i.variantId === variantId));
    this.setCart(cart);
    return cart;
  },

  clearCart() {
    this.setCart([]);
  },

  getMyOrders() {
    return api<Order[]>('/orders/my');
  },

  getById(id: string) {
    return api<Order>(`/orders/${id}`);
  },

  getAllOrders(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<Paginated<Order>>(`/orders${qs}`);
  },

  cancelOrder(id: string) {
    return api<Order>(`/orders/${id}/cancel`, { method: 'POST' });
  },

  createOrder(data: {
    items: OrderItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    paymentMethod: 'cod' | 'transfer' | 'vnpay' | 'momo';
    shippingInfo: Order['shippingInfo'];
    couponCode?: string;
  }) {
    return api<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items: data.items.map(({ productId, variantId, quantity }) => ({ productId, variantId, quantity })),
        paymentMethod: data.paymentMethod,
        shippingInfo: data.shippingInfo,
        couponCode: data.couponCode || undefined,
      }),
    });
  },

  updateStatus(id: string, status: string) {
    return api<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  updatePayment(id: string, paymentStatus: 'paid' | 'unpaid') {
    return api<Order>(`/orders/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify({ paymentStatus }),
    });
  },
};
