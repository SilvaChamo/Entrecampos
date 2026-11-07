'use client';

import { useState } from 'react';
import { Loader2, Mail, Send } from 'lucide-react';
import AuthShell, { AUTH_BUTTON, AUTH_FORM, AuthField, AuthMessage } from '@/components/Auth/AuthShell';
import AntiSpamFields, { resetAntiSpam } from '@/components/Antispam/AntiSpamFields';

/** Recuperar senha: pede o e-mail e envia a ligação para criar uma nova. Com anti-spam (honeypot + Turnstile). */
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
      setInfo(data.message || 'Se o e-mail estiver registado, receberá uma ligação para criar nova senha.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar o pedido.');
    } finally {
      resetAntiSpam();
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Lembrou-se da senha?" text="Volte ao início de sessão e continue connosco esta jornada" href="/login" label="Entrar">
      <form onSubmit={submit} className={AUTH_FORM}>
        <AuthMessage error={error} info={info} />

        <AuthField icon={Mail} label="E-mail da conta" required type="email" autoComplete="email" maxLength={254} value={email} onChange={(e) => setEmail(e.target.value)} />

        <AntiSpamFields fullWidth />

        <div className="flex justify-center">
          <button type="submit" disabled={loading} className={AUTH_BUTTON}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar ligação
              </>
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}
