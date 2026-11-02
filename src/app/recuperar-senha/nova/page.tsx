'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ChevronRight, Loader2, Lock } from 'lucide-react';

function Form() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== again) return setError('As palavras-passe não coincidem.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || 'Não foi possível guardar a palavra-passe.');
      setDone(data.message || 'Palavra-passe alterada. Já pode entrar.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar a palavra-passe.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-xl border border-[#ccd0d4] overflow-hidden">
        <div className="bg-[#1d2327] p-8 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">EntreCampos</h1>
          <p className="text-gray-400 text-sm">Criar nova palavra-passe</p>
        </div>
        <form onSubmit={submit} className="p-8 space-y-6">
          {!token && <p className="text-sm text-red-700">Ligação inválida. <Link href="/recuperar-senha" className="underline">Peça uma nova.</Link></p>}
          {error && (
            <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {done ? (
            <>
              <div className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{done}</div>
              <Link href="/login" className="block w-full py-3 bg-[#2271b1] text-white font-bold text-center hover:bg-[#135e96]">Ir para o login</Link>
            </>
          ) : (
            <>
              {(['Nova palavra-passe', 'Repetir palavra-passe'] as const).map((label, i) => (
                <div key={label}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      required
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#2271b1] focus:border-transparent outline-none"
                      value={i === 0 ? password : again}
                      onChange={(e) => (i === 0 ? setPassword(e.target.value) : setAgain(e.target.value))}
                    />
                  </div>
                </div>
              ))}
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 bg-[#2271b1] text-white font-bold hover:bg-[#135e96] transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Guardar palavra-passe <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default function NovaSenhaPage() {
  return (
    <Suspense fallback={null}>
      <Form />
    </Suspense>
  );
}
