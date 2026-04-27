'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'editor' | 'contribuidor' | 'guest';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, role: UserRole) => void;
  logout: () => void;
  register: (name: string, email: string, role: UserRole) => Promise<void>;
  setRole: (role: UserRole) => void; // For testing purposes
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial load: Try to get from localStorage or Supabase
    const savedUser = localStorage.getItem('entrecampos_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else {
      // Default admin users - sincronizado com Supabase
      setUser({
        id: '1',
        name: 'Administrador',
        email: 'admin@entrecampos.co.mz',
        role: 'admin'
      });
    }
    setLoading(false);
  }, []);

  const login = (email: string, role: UserRole) => {
    const newUser: User = { id: Math.random().toString(), name: email.split('@')[0], email, role };
    setUser(newUser);
    localStorage.setItem('entrecampos_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('entrecampos_user');
  };

  const register = async (name: string, email: string, role: UserRole) => {
    // In a real app, we would create the user in Supabase here
    const newUser: User = { id: Math.random().toString(), name, email, role };
    setUser(newUser);
    localStorage.setItem('entrecampos_user', JSON.stringify(newUser));
  };

  const setRole = (role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('entrecampos_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setRole }}>
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
