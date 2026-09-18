import { storageService } from './storageService';
import type { Order, CartItem, OrderItem, OrderStatus } from '../types';
import { orders as mockOrders } from '../data/mockData';
import { productService } from './productService';

const ORDERS_KEY = 'orders';
const CART_KEY = 'cart';

function ensureOrders(): Order[] {
  let orders = storageService.get<Order[]>(ORDERS_KEY, []);
  if (orders.length === 0) {
    orders = mockOrders;
    storageService.set(ORDERS_KEY, orders);
  }
  return orders;
}

export const orderService = {
  getCart(): CartItem[] {
    return storageService.get<CartItem[]>(CART_KEY, []);
  },

  setCart(items: CartItem[]): void {
    storageService.set(CART_KEY, items);
  },

  addToCart(productId: string, quantity = 1): CartItem[] {
    const cart = this.getCart();
    const existing = cart.find((i) => i.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }
    this.setCart(cart);
    return cart;
  },

  updateCartQuantity(productId: string, quantity: number): CartItem[] {
    let cart = this.getCart();
    if (quantity <= 0) {
      cart = cart.filter((i) => i.productId !== productId);
    } else {
      const item = cart.find((i) => i.productId === productId);
      if (item) item.quantity = quantity;
    }
    this.setCart(cart);
    return cart;
  },

  removeFromCart(productId: string): CartItem[] {
    const cart = this.getCart().filter((i) => i.productId !== productId);
    this.setCart(cart);
    return cart;
  },

  clearCart(): void {
    this.setCart([]);
  },

  getCartWithProducts(): (CartItem & { product: ReturnType<typeof productService.getById> })[] {
    const cart = this.getCart();
    return cart
      .map((item) => ({
        ...item,
        product: productService.getById(item.productId),
      }))
      .filter((i) => i.product);
  },

  getOrders(): Order[] {
    return ensureOrders().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getOrdersByUser(userId: string): Order[] {
    return this.getOrders().filter((o) => o.userId === userId);
  },

  getOrderById(id: string): Order | undefined {
    return ensureOrders().find((o) => o.id === id);
  },

  createOrder(data: {
    userId: string;
    userName: string;
    userEmail: string;
    items: OrderItem[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    paymentMethod: 'cod' | 'transfer';
    shippingInfo: Order['shippingInfo'];
  }): Order {
    const orders = ensureOrders();
    const order: Order = {
      id: `ord-${Date.now()}`,
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    orders.unshift(order);
    storageService.set(ORDERS_KEY, orders);
    this.clearCart();
    return order;
  },

  updateStatus(id: string, status: OrderStatus): Order | null {
    const orders = ensureOrders();
    const idx = orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    orders[idx].status = status;
    orders[idx].updatedAt = new Date().toISOString();
    storageService.set(ORDERS_KEY, orders);
    return orders[idx];
  },
};
