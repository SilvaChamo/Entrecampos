'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User, Mail, KeyRound, UserPlus, Loader2 } from 'lucide-react';
import AuthShell, { AUTH_BUTTON, AUTH_FORM, AuthField, AuthMessage } from '@/components/Auth/AuthShell';
import AntiSpamFields, { resetAntiSpam } from '@/components/Antispam/AntiSpamFields';
import Spinner from '@/components/Common/Spinner';

export default function RegisterPage() {
  const { user, loading: authLoading, login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/admin');
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      // Os campos anti-spam (honeypot, hora e Turnstile) seguem junto e são verificados no servidor.
      const antispam = Object.fromEntries(new FormData(e.currentTarget as HTMLFormElement).entries());
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...antispam, ...formData }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || 'Erro ao registar conta.');
      // Registo livre: a conta nova entra logo no painel de visitante.
      try {
        await login(formData.email, formData.password);
        router.push('/admin');
        return;
      } catch {
        setInfo('Conta criada. Entre com o seu e-mail e senha.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao registar conta.');
    } finally {
      resetAntiSpam();
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center">
        <Spinner size={32} className="" />
      </div>
    );
  }

  return (
    <AuthShell title="Já tem conta?" text="Entre com os seus dados e continue connosco esta jornada" href="/login" label="Entrar">
      <form onSubmit={handleSubmit} className={AUTH_FORM}>
        <AuthMessage error={error} info={info} />

        <AuthField icon={User} label="Nome completo" required type="text" autoComplete="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
        <AuthField icon={Mail} label="E-mail" required type="email" autoComplete="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
        <AuthField
          icon={KeyRound}
          label="Senha (mínimo 6 caracteres)"
          required
          autoComplete="new-password"
          type="password"
          minLength={6}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />

        <AntiSpamFields fullWidth />

        <div className="flex justify-center">
          <button type="submit" disabled={loading} className={AUTH_BUTTON}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Criar conta
              </>
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
