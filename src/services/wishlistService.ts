import { api } from './api';
import type { Product } from '../types';

export const wishlistService = {
  getAll() {
    return api<Product[]>('/wishlist');
  },

  add(productId: string) {
    return api<{ message: string }>(`/wishlist/${productId}`, { method: 'POST' });
  },

  remove(productId: string) {
    return api<{ message: string }>(`/wishlist/${productId}`, { method: 'DELETE' });
  },
};
