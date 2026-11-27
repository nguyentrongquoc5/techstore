import { useEffect } from 'react';

const DEFAULT_TITLE = 'TechStore – Thiết bị công nghệ chính hãng';

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title?.trim()
      ? `${title.trim()} | TechStore`
      : DEFAULT_TITLE;

    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [title]);
}
