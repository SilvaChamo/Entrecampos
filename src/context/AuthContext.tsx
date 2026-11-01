'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  mapSupabaseUser,
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
    const supabase = getSupabase();

    // Nunca deixar a UI presa no spinner
    const safety = window.setTimeout(() => {
      if (mounted) setLoading(false);
    }, 2500);

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        applyUser(session?.user ? mapSupabaseUser(session.user) : null);
      })
      .catch((err) => {
        console.warn('[auth] getSession falhou:', err);
        if (mounted) applyUser(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
        window.clearTimeout(safety);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      applyUser(session?.user ? mapSupabaseUser(session.user) : null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      window.clearTimeout(safety);
      subscription.unsubscribe();
    };
  }, [applyUser]);

  const login = async (email: string, password: string) => {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      throw new Error(translateAuthError(error?.message || 'Credenciais inválidas'));
    }

    try {
      await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      /* cookie opcional */
    }

    applyUser(mapSupabaseUser(data.user));
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

    if (!data.session) {
      throw new Error(
        'Conta criada. Verifique o e-mail para confirmar o registo antes de entrar.'
      );
    }

    applyUser(mapSupabaseUser(data.session.user));
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
