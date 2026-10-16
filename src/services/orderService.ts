import { api } from './api';
import type { Order, CartItem, OrderItem } from '../types';

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

  addToCart(productId: string, quantity = 1) {
    const cart = this.getCart();
    const existing = cart.find((i) => i.productId === productId);
    if (existing) existing.quantity += quantity;
    else cart.push({ productId, quantity });
    this.setCart(cart);
    return cart;
  },

  updateCartQuantity(productId: string, quantity: number) {
    let cart = this.getCart();
    if (quantity <= 0) cart = cart.filter((i) => i.productId !== productId);
    else {
      const item = cart.find((i) => i.productId === productId);
      if (item) item.quantity = quantity;
    }
    this.setCart(cart);
    return cart;
  },

  removeFromCart(productId: string) {
    const cart = this.getCart().filter((i) => i.productId !== productId);
    this.setCart(cart);
    return cart;
  },

  clearCart() {
    this.setCart([]);
  },

  getMyOrders() {
    return api<Order[]>('/orders/my');
  },

  getAllOrders() {
    return api<Order[]>('/orders');
  },

  createOrder(data: {
    items: OrderItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    paymentMethod: 'cod' | 'transfer';
    shippingInfo: Order['shippingInfo'];
  }) {
    return api<Order>('/orders', { method: 'POST', body: JSON.stringify(data) });
  },

  updateStatus(id: string, status: string) {
    return api<Order>(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },
};
