'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  /** Papel real da sessão (o `user.role` é o papel que está a ser visto, se o admin estiver a "ver como" outro). */
  realRole: UserRole | null;
  /** Papel que o administrador está a ver (null = o seu). Só no ecrã: o servidor continua a usar a sessão real. */
  viewAs: UserRole | null;
  setViewAs: (role: UserRole | null) => void;
}

const VIEW_AS_KEY = 'ec-view-as';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [realUser, setUser] = useState<User | null>(null);
  const [viewAs, setViewAsState] = useState<UserRole | null>(null);
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
        if (!mounted) return;
        applyUser(data?.user ?? null);
        // Mantém o "ver como" ao recarregar a página (só vale para administradores).
        try {
          const saved = sessionStorage.getItem(VIEW_AS_KEY) as UserRole | null;
          if (data?.user?.role === 'admin' && (saved === 'editor' || saved === 'contribuidor' || saved === 'guest')) setViewAsState(saved);
        } catch {
          /* sem armazenamento */
        }
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
    setViewAsState(null);
    try {
      sessionStorage.removeItem(VIEW_AS_KEY);
    } catch {
      /* sem armazenamento */
    }
    localStorage.removeItem('entrecampos_user');
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: UserRole
  ) => {
    const supabase = getSupabase();
    // Quem se regista entra sempre como visitante: editor e contribuidor são atribuídos pelo administrador.
    const safeRole: UserRole = 'guest';

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

  // "Ver como": só o administrador pode, e só muda o que vê no ecrã.
  const setViewAs = useCallback(
    (role: UserRole | null) => {
      if (realUser?.role !== 'admin') return;
      const next = role === 'admin' ? null : role;
      setViewAsState(next);
      try {
        if (next) sessionStorage.setItem(VIEW_AS_KEY, next);
        else sessionStorage.removeItem(VIEW_AS_KEY);
      } catch {
        /* sem armazenamento */
      }
    },
    [realUser],
  );

  const user = useMemo<User | null>(() => (realUser && viewAs ? { ...realUser, role: viewAs } : realUser), [realUser, viewAs]);
  const setRole = (role: UserRole) => setViewAs(role);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, setRole, realRole: realUser?.role ?? null, viewAs, setViewAs }}>
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
