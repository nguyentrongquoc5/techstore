import { api } from './api';
import type { User } from '../types';

const TOKEN_KEY = 'techstore_token';
const USER_KEY = 'techstore_current_user';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  getCurrentUser(): User | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  },

  setSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async login(email: string, password: string) {
    const data = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setSession(data.token, data.user);
    return data;
  },

  async register(payload: { email: string; password: string; fullName: string; phone: string }) {
    const data = await api<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    this.setSession(data.token, data.user);
    return data;
  },

  async me() {
    const user = await api<User>('/auth/me');
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async updateProfile(data: Partial<User>) {
    const user = await api<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async changePassword(oldPassword: string, newPassword: string) {
    return api('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  },

  logout() {
    this.clearSession();
  },
};
