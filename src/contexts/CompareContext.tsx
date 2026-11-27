import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'techstore_compare';
const MAX_COMPARE = 4;

interface CompareContextValue {
  productIds: string[];
  toggle: (productId: string) => boolean;
  has: (productId: string) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextValue | null>(null);

function readCompareIds(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string').slice(0, MAX_COMPARE) : [];
  } catch {
    return [];
  }
}

export function CompareProvider({ children }: { children: ReactNode }) {
  const [productIds, setProductIds] = useState<string[]>([]);

  useEffect(() => setProductIds(readCompareIds()), []);

  const update = (ids: string[]) => {
    setProductIds(ids);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  };

  const toggle = (productId: string) => {
    if (productIds.includes(productId)) {
      update(productIds.filter((id) => id !== productId));
      return false;
    }
    if (productIds.length >= MAX_COMPARE) throw new Error(`Có thể so sánh tối đa ${MAX_COMPARE} sản phẩm`);
    update([...productIds, productId]);
    return true;
  };

  return (
    <CompareContext.Provider value={{
      productIds,
      toggle,
      has: (productId) => productIds.includes(productId),
      clear: () => update([]),
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) throw new Error('useCompare must be used within CompareProvider');
  return context;
}
