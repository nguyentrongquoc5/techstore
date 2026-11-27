import { api } from './api';
import type { Product, Category, Paginated } from '../types';

export const productService = {
  getAll(params?: Record<string, string>) {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<Paginated<Product>>(`/products${qs}`);
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

  getBrands(category?: string, status = 'active') {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (status !== 'active') params.set('status', status);
    const query = params.toString();
    const qs = query ? `?${query}` : '';
    return api<string[]>(`/products/brands${qs}`);
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

  uploadImages(files: File[]) {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    return api<{ paths: string[] }>('/products/upload', {
      method: 'POST',
      body: formData,
    });
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
