import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authService } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: { email: string; password: string; fullName: string; phone: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; message?: string }>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(authService.getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then(setUser)
      .catch(() => {
        authService.clearSession();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await authService.login(email, password);
      setUser(data.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Đăng nhập thất bại' };
    }
  };

  const register = async (data: { email: string; password: string; fullName: string; phone: string }) => {
    try {
      const res = await authService.register(data);
      setUser(res.user);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || 'Đăng ký thất bại' };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    try {
      const u = await authService.updateProfile(data);
      setUser(u);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const changePassword = async (oldPass: string, newPass: string) => {
    try {
      await authService.changePassword(oldPass, newPass);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  };

  const refreshUser = async () => {
    try {
      const u = await authService.me();
      setUser(u);
    } catch {
      /* ignore */
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        loading,
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
