'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight, Loader2, Mail } from 'lucide-react';
import AntiSpamFields, { resetAntiSpam } from '@/components/Antispam/AntiSpamFields';

/** Recuperar palavra-passe: pede o e-mail e envia a ligação para criar uma nova. Com anti-spam (honeypot + Turnstile). */
export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const antispam = Object.fromEntries(new FormData(e.currentTarget).entries());
      const res = await fetch('/api/auth/recover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...antispam, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar o pedido.');
      setInfo(data.message || 'Se o e-mail estiver registado, receberá uma ligação para criar nova palavra-passe.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o pedido.');
    } finally {
      resetAntiSpam();
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-xl border border-[#ccd0d4] overflow-hidden">
        <div className="bg-[#1d2327] p-8 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">EntreCampos</h1>
          <p className="text-gray-400 text-sm">Recuperar palavra-passe</p>
        </div>
        <form onSubmit={submit} className="p-8 space-y-6">
          {error && (
            <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {info && <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">{info}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail da conta</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                required
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="exemplo@email.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#2271b1] focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <AntiSpamFields />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2271b1] text-white font-bold hover:bg-[#135e96] transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Enviar ligação <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link href="/login" className="text-[#2271b1] hover:underline font-medium">Voltar ao login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
