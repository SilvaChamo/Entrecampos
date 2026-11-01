'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  roleToMetadata,
  translateAuthError,
  type AppUser,
  type UserRole,
} from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';

export type { UserRole };
export type User = AppUser;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((next: AppUser | null) => {
    setUser(next);
  }, []);

  useEffect(() => {
    let mounted = true;

    // O utilizador e o papel vêm da sessão do servidor (cookie assinado), que é a que decide os acessos.
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (mounted) applyUser(data?.user ?? null);
      })
      .catch(() => {
        if (mounted) applyUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [applyUser]);

  const login = async (email: string, password: string) => {
    // A rota do servidor valida as credenciais (administrador de emergência ou Supabase),
    // exige conta aceite e cria a sessão (cookie).
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.user) {
      throw new Error(data.error || 'Credenciais inválidas');
    }

    // Sessão do Supabase no browser (para leituras com a chave pública); opcional.
    if (email.includes('@')) {
      try {
        await getSupabase().auth.signInWithPassword({ email: email.trim(), password });
      } catch {
        /* sem Supabase no browser: a sessão do servidor chega */
      }
    }

    applyUser(data.user);
    setLoading(false);
  };

  const logout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      /* ignore */
    }
    applyUser(null);
    localStorage.removeItem('entrecampos_user');
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => {
    const supabase = getSupabase();
    const safeRole: UserRole = role === 'admin' || role === 'editor' ? 'guest' : role;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          app: 'entrecampos',
          full_name: name.trim(),
          username: email.trim().split('@')[0],
          role: roleToMetadata(safeRole),
          site_id: 'entrecampos',
        },
      },
    });

    if (error) {
      throw new Error(translateAuthError(error.message));
    }

    // Nunca fica com sessão: a conta só entra no painel depois de aceite pelo administrador.
    if (data.session) await supabase.auth.signOut();
    throw new Error('Conta criada. O administrador tem de a aceitar antes de poder entrar no painel.');
  };

  const setRole = (role: UserRole) => {
    if (user) setUser({ ...user, role });
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
