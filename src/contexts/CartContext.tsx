import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '../types';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';

interface CartContextType {
  items: (CartItem & { product: Product })[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<(CartItem & { product: Product })[]>([]);

  const refresh = async () => {
    const cart = orderService.getCart();
    if (!cart.length) {
      setItems([]);
      return;
    }
    const products = await productService.getAll({ status: 'active' }).catch(() => [] as Product[]);
    const map = new Map(products.map((p) => [p.id, p]));
    // fetch missing individually
    const enriched: (CartItem & { product: Product })[] = [];
    for (const c of cart) {
      let p = map.get(c.productId);
      if (!p) {
        try {
          p = await productService.getById(c.productId);
        } catch {
          continue;
        }
      }
      enriched.push({ ...c, product: p });
    }
    setItems(enriched);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addItem = async (productId: string, quantity = 1) => {
    orderService.addToCart(productId, quantity);
    await refresh();
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
    setItems([]);
  };

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (i.product.salePrice ?? i.product.price) * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, addItem, updateQuantity, removeItem, clearCart, refresh }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
