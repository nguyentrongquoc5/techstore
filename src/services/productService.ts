import { api } from './api';
import type { Product, Category } from '../types';

export const productService = {
  getAll(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<Product[]>(`/products${qs}`);
  },

  getById(id: string) {
    return api<Product>(`/products/${id}`);
  },

  getFeatured() {
    return api<Product[]>('/products/featured');
  },

  getBestSellers() {
    return api<Product[]>('/products/best-sellers');
  },

  getCategories() {
    return api<Category[]>('/categories');
  },

  create(data: Partial<Product>) {
    return api<Product>('/products', { method: 'POST', body: JSON.stringify(data) });
  },

  update(id: string, data: Partial<Product>) {
    return api<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  delete(id: string) {
    return api(`/products/${id}`, { method: 'DELETE' });
  },

  createCategory(data: { name: string; description?: string }) {
    return api<Category>('/categories', { method: 'POST', body: JSON.stringify(data) });
  },

  updateCategory(id: string, data: Partial<Category>) {
    return api<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  deleteCategory(id: string) {
    return api(`/categories/${id}`, { method: 'DELETE' });
  },
};
