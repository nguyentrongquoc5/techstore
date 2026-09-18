import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => { success: boolean; message?: string };
  register: (data: { email: string; password: string; fullName: string; phone: string }) => { success: boolean; message?: string };
  logout: () => void;
  updateProfile: (data: Partial<User>) => { success: boolean; message?: string };
  changePassword: (oldPass: string, newPass: string) => { success: boolean; message?: string };
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const current = authService.getCurrentUser();
    setUser(current);
  }, []);

  const login = (email: string, password: string) => {
    const result = authService.login(email, password);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, message: result.message };
  };

  const register = (data: { email: string; password: string; fullName: string; phone: string }) => {
    const result = authService.register(data);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, message: result.message };
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return { success: false, message: 'Chưa đăng nhập' };
    const result = authService.updateProfile(user.id, data);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return { success: result.success, message: result.message };
  };

  const changePassword = (oldPass: string, newPass: string) => {
    if (!user) return { success: false, message: 'Chưa đăng nhập' };
    return authService.changePassword(user.id, oldPass, newPass);
  };

  const refreshUser = () => {
    setUser(authService.getCurrentUser());
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
