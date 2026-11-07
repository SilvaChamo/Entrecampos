'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { Mail, KeyRound, LogIn, Loader2, AlertCircle } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import { destinoDepoisDeEntrar, proximoDoEndereco } from '@/lib/auth';

// Letra do modelo de referência (Poppins), só nesta página.
const poppins = Poppins({ subsets: ['latin'], weight: ['400', '500', '600', '700'], style: ['normal', 'italic'] });

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

  // Campo do modelo: caixa branca com barra de cor à esquerda, brilho suave, ícone, traço vertical e texto em itálico.
  const box = 'flex h-[54px] items-center bg-white border-l-[4px] border-[#0f6e3a] shadow-[0_0_16px_rgba(0,166,81,0.22)]';
  const input = 'h-full min-w-0 flex-1 bg-transparent pr-3 text-[13px] italic text-[#1d1d1d] outline-none placeholder:italic placeholder:text-gray-400';

  return (
    <div className={`${poppins.className} [&_*]:[font-family:inherit] relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7f7f9] px-4 py-10`}>
      {/* Círculos de degradé nos cantos, como no modelo */}
      <span className="pointer-events-none absolute -left-[90px] -top-[100px] h-[220px] w-[220px] rounded-full bg-gradient-to-br from-[#00a651] to-[#0b5a2e]" />
      <span className="pointer-events-none absolute -bottom-[60px] -right-[60px] h-[170px] w-[170px] rounded-full bg-gradient-to-br from-[#0f6e3a] to-[#063d1f]" />

      <div className="relative flex w-full max-w-[860px] flex-col items-center md:flex-row md:items-center md:justify-center">
        {/* Cartão branco: logótipo, título, campos e botão */}
        <div className="relative z-10 w-full max-w-[400px] bg-white px-8 pb-12 pt-9 shadow-[0_10px_40px_rgba(0,0,0,0.12)] md:w-[400px] md:shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/logo.png" alt="EntreCAMPOS" className="mx-auto mb-6 h-12 w-auto" />
          <h1 className="mx-auto mb-8 w-fit border-b border-[#1d1d1d] text-[20px] font-medium leading-snug text-[#1d1d1d]">Iniciar sessão</h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className={box}>
              <Mail className="mx-3 h-5 w-5 shrink-0 text-gray-500" strokeWidth={1.5} />
              <span className="h-4 w-px shrink-0 bg-gray-400" />
              <input
                aria-label="E-mail ou utilizador"
                required
                type="text"
                autoComplete="username"
                placeholder="E-mail ou utilizador"
                className={`${input} pl-3`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className={box}>
              <KeyRound className="mx-3 h-5 w-5 shrink-0 text-gray-500" strokeWidth={1.5} />
              <span className="h-4 w-px shrink-0 bg-gray-400" />
              <input
                aria-label="Senha"
                required
                autoComplete="current-password"
                type="password"
                placeholder="Senha"
                minLength={6}
                className={`${input} pl-3`}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 text-[12px] text-gray-600">
              <label className="flex cursor-pointer items-center gap-3">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-[18px] w-[18px] accent-[#4b5563]" />
                Lembrar-me
              </label>
              <Link href="/recuperar-senha" className="border-b border-[#1d1d1d] text-[#1d1d1d]">
                Esqueceu a senha?
              </Link>
            </div>

            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex h-[40px] min-w-[140px] items-center justify-center gap-2 bg-[#0f6e3a] px-6 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(15,110,58,0.35)] transition-colors hover:bg-[#0b5a2e] disabled:opacity-70"
              >
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

            <p className="pt-1 text-center text-[11px]">
              <button type="button" onClick={() => window.location.assign('/api/auth/google')} className="border-b border-gray-400 text-gray-500 hover:text-[#1d1d1d]">
                Continuar com o Google
              </button>
            </p>
          </form>
        </div>

        {/* Cartão verde: ondas em degradé, boas-vindas e botão de registo; passa por baixo do cartão branco */}
        <div className="relative mt-4 w-full max-w-[400px] overflow-hidden bg-gradient-to-br from-[#0b7a3c] via-[#0f6e3a] to-[#0a5a2f] shadow-[0_10px_40px_rgba(0,0,0,0.18)] md:-ml-[24px] md:mt-0 md:h-[520px] md:w-[440px] md:max-w-none md:shrink-0">
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 440 520" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="ecg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#00a651" stopOpacity="0.55" /><stop offset="1" stopColor="#0f6e3a" stopOpacity="0.1" /></linearGradient>
              <linearGradient id="ecg2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#063d1f" stopOpacity="0.75" /><stop offset="1" stopColor="#0f6e3a" stopOpacity="0.1" /></linearGradient>
            </defs>
            <path d="M60 0 C 40 120 150 150 230 200 C 330 262 420 210 440 90 L 440 0 Z" fill="url(#ecg1)" />
            <path d="M0 330 C 90 300 180 360 250 420 C 320 480 400 440 440 380 L 440 520 L 0 520 Z" fill="url(#ecg2)" />
            <path d="M0 150 C 40 160 55 230 20 290 C 10 305 0 300 0 290 Z" fill="#00a651" fillOpacity="0.35" />
            <path d="M440 280 C 405 290 395 350 440 380 Z" fill="#00a651" fillOpacity="0.35" />
          </svg>
          <div className="relative flex h-full min-h-[300px] flex-col items-center justify-center px-8 py-14 text-center text-white md:pl-14">
            <h2 className="text-[18px] font-bold tracking-wide">BEM-VINDO!</h2>
            <p className="mt-2 max-w-[300px] text-[12px] leading-relaxed">Introduza os seus dados e comece connosco esta jornada</p>
            <Link
              href="/register"
              className="mt-8 flex h-[40px] min-w-[110px] items-center justify-center bg-[#063d1f]/70 px-6 text-[11px] font-bold uppercase tracking-wide text-white shadow-[0_6px_14px_rgba(0,0,0,0.25)] transition-colors hover:bg-[#063d1f]"
            >
              Registar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
