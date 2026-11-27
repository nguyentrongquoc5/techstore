const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function getToken(): string | null {
  return localStorage.getItem('techstore_token');
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!isFormData) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Lỗi ${res.status}`);
  }
  return data as T;
}

export function mediaUrl(path: string): string {
  if (!path || path.endsWith('/placeholder.jpg')) return '/images/products/placeholder.svg';
  if (path.startsWith('http')) return path;
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api').replace(/\/api$/, '');
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export { API_URL };
