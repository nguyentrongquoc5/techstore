import { useState } from 'react';

export const MAX_PAGE_SIZE = 500;

export function usePageSize(key: string, defaultSize = 6) {
  const [pageSize, setPageSizeState] = useState(() => {
    const stored = window.localStorage.getItem(key);
    const size = stored ? Number(stored) : defaultSize;
    return Number.isSafeInteger(size) && size > 0 && size <= MAX_PAGE_SIZE ? size : defaultSize;
  });

  const setPageSize = (size: number) => {
    if (!Number.isSafeInteger(size) || size <= 0 || size > MAX_PAGE_SIZE) return;
    setPageSizeState(size);
    window.localStorage.setItem(key, String(size));
  };

  return [pageSize, setPageSize] as const;
}
