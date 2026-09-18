import { storageService } from './storageService';
import type { User } from '../types';
import { users as mockUsers } from '../data/mockData';

const USERS_KEY = 'users';
const CURRENT_USER_KEY = 'current_user';

function ensureUsers(): User[] {
  let users = storageService.get<User[]>(USERS_KEY, []);
  if (users.length === 0) {
    users = mockUsers;
    storageService.set(USERS_KEY, users);
  }
  return users;
}

export const authService = {
  getUsers(): User[] {
    return ensureUsers();
  },

  getCurrentUser(): User | null {
    return storageService.get<User | null>(CURRENT_USER_KEY, null);
  },

  login(email: string, password: string): { success: boolean; user?: User; message?: string } {
    const users = ensureUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) {
      return { success: false, message: 'Email hoặc mật khẩu không đúng' };
    }
    if (!user.isActive) {
      return { success: false, message: 'Tài khoản đã bị khóa' };
    }
    storageService.set(CURRENT_USER_KEY, user);
    return { success: true, user };
  },

  register(data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
  }): { success: boolean; user?: User; message?: string } {
    const users = ensureUsers();
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, message: 'Email đã được sử dụng' };
    }
    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
      address: '',
      city: '',
      district: '',
      role: 'USER',
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    storageService.set(USERS_KEY, users);
    storageService.set(CURRENT_USER_KEY, newUser);
    return { success: true, user: newUser };
  },

  logout(): void {
    storageService.remove(CURRENT_USER_KEY);
  },

  updateProfile(userId: string, data: Partial<User>): { success: boolean; user?: User; message?: string } {
    const users = ensureUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, message: 'Không tìm thấy người dùng' };
    users[idx] = { ...users[idx], ...data, id: users[idx].id, email: users[idx].email, role: users[idx].role };
    storageService.set(USERS_KEY, users);
    const current = storageService.get<User | null>(CURRENT_USER_KEY, null);
    if (current && current.id === userId) {
      storageService.set(CURRENT_USER_KEY, users[idx]);
    }
    return { success: true, user: users[idx] };
  },

  changePassword(userId: string, oldPass: string, newPass: string): { success: boolean; message?: string } {
    const users = ensureUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, message: 'Không tìm thấy người dùng' };
    if (users[idx].password !== oldPass) return { success: false, message: 'Mật khẩu cũ không đúng' };
    users[idx].password = newPass;
    storageService.set(USERS_KEY, users);
    const current = storageService.get<User | null>(CURRENT_USER_KEY, null);
    if (current && current.id === userId) {
      storageService.set(CURRENT_USER_KEY, users[idx]);
    }
    return { success: true };
  },

  updateUserByAdmin(userId: string, data: Partial<User>): { success: boolean; user?: User } {
    const users = ensureUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false };
    users[idx] = { ...users[idx], ...data };
    storageService.set(USERS_KEY, users);
    return { success: true, user: users[idx] };
  },
};
