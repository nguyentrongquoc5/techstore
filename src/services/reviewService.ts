import { api } from './api';
import type { Review, ReviewListResponse } from '../types';

export const reviewService = {
  list(productId: string, page = 1, limit = 10) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return api<ReviewListResponse>(`/products/${productId}/reviews?${params}`);
  },

  listAll(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{
      items: Array<{
        id: string;
        rating: number;
        comment: string;
        createdAt: string;
        user: { id: string; fullName: string; email: string };
        product: { id: string; name: string };
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/reviews${qs}`);
  },

  create(productId: string, data: { rating: number; comment: string }) {
    return api<Review>(`/products/${productId}/reviews`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: string, data: { rating: number; comment: string }) {
    return api<Review>(`/reviews/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  remove(id: string) {
    return api<{ message: string }>(`/reviews/${id}`, { method: 'DELETE' });
  },
};
