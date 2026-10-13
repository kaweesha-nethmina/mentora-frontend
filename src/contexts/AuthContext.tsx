'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { authApi, User, LoginData, RegisterData } from '@/lib/api/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<{ success: boolean; message?: string }>;
  register: (data: RegisterData) => Promise<{ success: boolean; message?: string }>;
  loginWithGoogle: () => void;
  completeGoogleLogin: (ticket: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : null;
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const redirectOnLogout = useRef(false);

  const refreshUser = async () => {
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
  };

  useEffect(() => {
    const initAuth = async () => {
      if (authApi.isAuthenticated()) {
        await refreshUser();
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (redirectOnLogout.current && user === null) {
      window.location.href = '/login';
      redirectOnLogout.current = false;
    }
  }, [user]);

  const login = async (data: LoginData) => {
    const result = await authApi.login(data);
    if (result.success) {
      if (result.data?.user) setUser(result.data.user);
      return { success: true };
    }
    return { success: false, message: result.message || 'Login failed' };
  };

  const register = async (data: RegisterData) => {
    const result = await authApi.register(data);
    if (result.success) {
      if (result.data?.user) setUser(result.data.user);
      return { success: true };
    }
    return { success: false, message: result.message || 'Registration failed' };
  };

  const loginWithGoogle = () => {
    if (typeof window === 'undefined') return;
    window.location.href = authApi.getGoogleAuthUrl();
  };

  const completeGoogleLogin = async (ticket: string) => {
    const result = await authApi.googleExchange(ticket);
    if (result.success) {
      if (result.data?.user) setUser(result.data.user);
      return { success: true };
    }
    return { success: false, message: result.message || 'Google sign-in failed' };
  };

  const logout = async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    redirectOnLogout.current = true;
    try {
      await authApi.logout();
    } catch {}
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        loginWithGoogle,
        completeGoogleLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
