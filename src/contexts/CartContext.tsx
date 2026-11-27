import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Product, ProductVariant } from '../types';
import { orderService } from '../services/orderService';
import { productService } from '../services/productService';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: (CartItem & { product: Product })[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  removeItem: (productId: string, variantId?: string) => void;
  clearCart: () => void;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<(CartItem & { product: Product; variant?: ProductVariant })[]>([]);
  const { isAuthenticated } = useAuth();

  const refresh = async () => {
    const cart = orderService.getCart();
    if (!cart.length) {
      setItems([]);
      return;
    }
    const response = await productService.getAll({ status: 'active', limit: '50' }).catch(() => null);
    const products = response?.items ?? [];
    const map = new Map(products.map((p) => [p.id, p]));
    // fetch missing individually
    const enriched: (CartItem & { product: Product; variant?: ProductVariant })[] = [];
    for (const c of cart) {
      let p = map.get(c.productId);
      if (!p) {
        try {
          p = await productService.getById(c.productId);
        } catch {
          continue;
        }
      }
      enriched.push({ ...c, product: p, variant: p.variants?.find((variant) => variant.id === c.variantId) });
    }
    setItems(enriched);
  };

  useEffect(() => {
    refresh();
  }, []);

  const addItem = async (productId: string, quantity = 1, variantId?: string) => {
    if (!isAuthenticated) {
      throw new Error('Vui lòng đăng nhập trước khi thêm sản phẩm vào giỏ hàng');
    }
    if (!Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error('Số lượng sản phẩm không hợp lệ');
    }
    const product = await productService.getById(productId);
    const variant = variantId ? product.variants?.find((entry) => entry.id === variantId) : undefined;
    if (product.variants?.length && !variant) {
      throw new Error('Vui lòng chọn biến thể sản phẩm');
    }
    if (variant && !variant.isActive) throw new Error('Biến thể đang ngừng bán');
    const currentQuantity = orderService.getCart()
      .find((item) => item.productId === productId && item.variantId === variantId)?.quantity ?? 0;
    if (product.status !== 'active') {
      throw new Error('Sản phẩm đang ngừng bán');
    }
    const stock = variant?.stock ?? product.stock;
    if (currentQuantity + quantity > stock) {
      throw new Error(
        stock === 0
          ? 'Sản phẩm đã hết hàng'
          : `Chỉ còn ${stock} sản phẩm trong kho`,
      );
    }
    orderService.addToCart(productId, quantity, variantId);
    await refresh();
  };

  const updateQuantity = (productId: string, quantity: number, variantId?: string) => {
    orderService.updateCartQuantity(productId, quantity, variantId);
    refresh();
  };

  const removeItem = (productId: string, variantId?: string) => {
    orderService.removeFromCart(productId, variantId);
    refresh();
  };

  const clearCart = () => {
    orderService.clearCart();
    setItems([]);
  };

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + (i.variant?.price ?? i.product.salePrice ?? i.product.price) * i.quantity, 0);

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
