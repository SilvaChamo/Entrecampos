'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, KeyRound, LogIn, Loader2 } from 'lucide-react';
import AuthShell, { AUTH_BUTTON, AUTH_FORM, AUTH_LINK, AuthField, AuthMessage } from '@/components/Auth/AuthShell';
import Spinner from '@/components/Common/Spinner';
import { destinoDepoisDeEntrar, proximoDoEndereco } from '@/lib/auth';

export default function LoginPage() {
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [remember, setRemember] = useState(false);

  // "Lembrar-me": guarda só o e-mail/utilizador neste navegador, para vir já preenchido na próxima visita.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ec_login_email');
      if (saved) {
        setFormData((f) => ({ ...f, email: saved }));
        setRemember(true);
      }
    } catch {
      /* navegador sem armazenamento */
    }
  }, []);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('erro');
    if (code === 'google-config') setError('A entrada com o Google ainda não está configurada.');
    else if (code === 'suspensa') setError('Esta conta está suspensa no EntreCAMPOS.');
    else if (code) setError('Não foi possível entrar com o Google. Tente outra vez.');
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace(destinoDepoisDeEntrar(proximoDoEndereco()));
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      try {
        if (remember) localStorage.setItem('ec_login_email', formData.email);
        else localStorage.removeItem('ec_login_email');
      } catch {
        /* navegador sem armazenamento */
      }
      router.push(destinoDepoisDeEntrar(proximoDoEndereco())); // sem endereço pedido, o /admin leva cada papel ao seu painel
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao entrar. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Mostra o formulário logo; só cobre com spinner se já houver user a redireccionar
  if (user) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center">
        <Spinner size={32} className="" />
      </div>
    );
  }

  return (
    <AuthShell title="Bem-vindo!" text="Introduza os seus dados e comece connosco esta jornada" href="/register" label="Registar">
      <form onSubmit={handleSubmit} className={AUTH_FORM}>
        <AuthMessage error={error} />

        <AuthField
          icon={Mail}
          label="E-mail ou utilizador"
          required
          type="text"
          autoComplete="username"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <AuthField
          icon={KeyRound}
          label="Senha"
          required
          autoComplete="current-password"
          type="password"
          minLength={6}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <div className="flex flex-col items-center gap-2 text-[12px] text-gray-600 md:flex-row md:justify-between md:gap-3 md:pt-1">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-[18px] w-[18px] accent-[#4b5563]" />
            Lembrar-me
          </label>
          <Link href="/recuperar-senha" className={AUTH_LINK}>
            Esqueceu a senha?
          </Link>
        </div>

        <div className="flex justify-center">
          <button type="submit" disabled={loading} className={AUTH_BUTTON}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Entrar
              </>
            )}
          </button>
        </div>

        <p className="-mt-1 text-center text-[11px] md:-mt-2">
          <button type="button" onClick={() => window.location.assign('/api/auth/google')} className="border-b border-gray-400 text-gray-500 transition-colors hover:border-[#d6101c] hover:text-[#d6101c]">
            Continuar com o Google
          </button>
        </p>
      </form>
    </AuthShell>
  );
}
