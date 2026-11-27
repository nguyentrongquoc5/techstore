import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { wishlistService } from '../services/wishlistService';

interface WishlistContextType {
  productIds: Set<string>;
  loading: boolean;
  isWishlisted: (productId: string) => boolean;
  toggle: (productId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [productIds, setProductIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setProductIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const list = await wishlistService.getAll();
      setProductIds(new Set(list.map((p) => p.id)));
    } catch {
      setProductIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isWishlisted = useCallback(
    (productId: string) => productIds.has(productId),
    [productIds]
  );

  const toggle = useCallback(
    async (productId: string) => {
      if (!isAuthenticated) return;
      const liked = productIds.has(productId);
      // Optimistic update
      setProductIds((prev) => {
        const next = new Set(prev);
        if (liked) next.delete(productId);
        else next.add(productId);
        return next;
      });
      try {
        if (liked) await wishlistService.remove(productId);
        else await wishlistService.add(productId);
      } catch {
        // rollback
        setProductIds((prev) => {
          const next = new Set(prev);
          if (liked) next.add(productId);
          else next.delete(productId);
          return next;
        });
        throw new Error('Không thể cập nhật yêu thích');
      }
    },
    [isAuthenticated, productIds]
  );

  return (
    <WishlistContext.Provider value={{ productIds, loading, isWishlisted, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}
