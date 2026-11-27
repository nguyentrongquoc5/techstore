import { api, API_URL } from './api';
import type { Role, User } from '../types';

export const userService = {
  getAll() {
    return api<User[]>('/users');
  },
  create(data: { email: string; password: string; fullName: string; phone: string; role: Role }) {
    return api<User>('/users', { method: 'POST', body: JSON.stringify(data) });
  },
  update(id: string, data: Partial<User>) {
    return api<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  remove(id: string) {
    return api<{ message: string }>(`/users/${id}`, { method: 'DELETE' });
  },
};

export const statsService = {
  dashboard() {
    return api<any>('/stats/dashboard');
  },
  async downloadReport(type: 'orders' | 'revenue') {
    const token = localStorage.getItem('techstore_token');
    const response = await fetch(`${API_URL}/stats/report?type=${type}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Không tải được báo cáo (${response.status})`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `techstore-${type}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  },
};
