'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from './api';

interface User {
  id: string;
  email: string;
  role: string;
  fullName?: string;
  profileCompleted: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Hydrate from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      const updatedUser = {
        id: res.data.user._id,
        email: res.data.user.email,
        role: res.data.user.role,
        fullName: res.data.user.fullName,
        profileCompleted: res.data.user.profileCompleted,
      };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {
      // Token might be invalid
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    const userObj: User = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      fullName: userData.fullName,
      profileCompleted: userData.profileCompleted,
    };
    setToken(newToken);
    setUser(userObj);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userObj));
  };

  const register = async (email: string, password: string) => {
    const res = await api.post('/auth/register', { email, password });
    const { token: newToken, user: userData } = res.data;
    const userObj: User = {
      id: userData.id,
      email: userData.email,
      role: userData.role,
      fullName: userData.fullName,
      profileCompleted: userData.profileCompleted,
    };
    setToken(newToken);
    setUser(userObj);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userObj));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
