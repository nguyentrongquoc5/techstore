import { useState } from 'react';

export function usePageSize(key: string, defaultSize = 6) {
  const [pageSize, setPageSizeState] = useState(() => {
    const stored = window.localStorage.getItem(key);
    const size = stored ? Number(stored) : defaultSize;
    return [6, 12, 20, 50].includes(size) ? size : defaultSize;
  });

  const setPageSize = (size: number) => {
    setPageSizeState(size);
    window.localStorage.setItem(key, String(size));
  };

  return [pageSize, setPageSize] as const;
}
