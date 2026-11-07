'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, KeyRound, Save } from 'lucide-react';
import AuthShell, { AUTH_BUTTON, AUTH_FORM, AUTH_LINK, AuthField, AuthMessage } from '@/components/Auth/AuthShell';

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
    if (password !== again) return setError('As senhas não coincidem.');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/recover/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || 'Não foi possível guardar a senha.');
      setDone(data.message || 'Senha alterada. Já pode entrar.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar a senha.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Lembrou-se da senha?" text="Volte ao início de sessão e continue connosco esta jornada" href="/login" label="Entrar">
      <form onSubmit={submit} className={AUTH_FORM}>
        {!token && (
          <p className="text-[12px] text-red-700">
            Ligação inválida.{' '}
            <Link href="/recuperar-senha" className={AUTH_LINK}>Peça uma nova.</Link>
          </p>
        )}
        <AuthMessage error={error} info={done} />
        {done ? (
          <div className="flex justify-center">
            <Link href="/login" className={AUTH_BUTTON}>Ir para o login</Link>
          </div>
        ) : (
          <>
            <AuthField icon={KeyRound} label="Nova senha" required type="password" autoComplete="new-password" minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} />
            <AuthField icon={KeyRound} label="Repetir senha" required type="password" autoComplete="new-password" minLength={8} maxLength={128} value={again} onChange={(e) => setAgain(e.target.value)} />
            <div className="flex justify-center">
              <button type="submit" disabled={loading || !token} className={AUTH_BUTTON}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Guardar senha
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </AuthShell>
  );
}

export default function NovaSenhaPage() {
  return (
    <Suspense fallback={null}>
      <Form />
    </Suspense>
  );
}
