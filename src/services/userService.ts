import { api } from './api';
import type { User } from '../types';

export const userService = {
  getAll() {
    return api<User[]>('/users');
  },
  update(id: string, data: Partial<User>) {
    return api<User>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
};

export const statsService = {
  dashboard() {
    return api<any>('/stats/dashboard');
  },
};
