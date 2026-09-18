import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';

interface CartContextType {
  items: (CartItem & { product: Product })[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  refresh: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<(CartItem & { product: Product })[]>([]);

  const refresh = () => {
    const cartItems = orderService.getCartWithProducts() as (CartItem & { product: Product })[];
    setItems(cartItems);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addItem = (productId: string, quantity = 1) => {
    orderService.addToCart(productId, quantity);
    refresh();
  };

  const updateQuantity = (productId: string, quantity: number) => {
    orderService.updateCartQuantity(productId, quantity);
    refresh();
  };

  const removeItem = (productId: string) => {
    orderService.removeFromCart(productId);
    refresh();
  };

  const clearCart = () => {
    orderService.clearCart();
    refresh();
  };

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => {
    const price = i.product.salePrice ?? i.product.price;
    return sum + price * i.quantity;
  }, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
