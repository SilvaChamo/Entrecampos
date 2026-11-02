'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import AntiSpamFields, { resetAntiSpam } from '@/components/Antispam/AntiSpamFields';

/** Subscrição da newsletter (rodapé). Protegida por honeypot, tempo mínimo e Cloudflare Turnstile. */
export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'ok' | 'error'; text?: string }>({ kind: 'idle' });

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: 'sending' });
    try {
      const antispam = Object.fromEntries(new FormData(e.currentTarget).entries());
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...antispam, email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || 'Não foi possível subscrever.');
      setEmail('');
      setState({ kind: 'ok', text: data.message || 'Subscrição feita. Obrigado!' });
    } catch (err) {
      setState({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível subscrever.' });
    } finally {
      resetAntiSpam();
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-5 max-w-sm">
      <div className="flex">
        <input
          type="email"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="O seu email..."
          className="min-w-0 flex-1 bg-white px-3 py-2 text-[11px] text-gray-800 outline-none"
        />
        <button type="submit" aria-label="Enviar" disabled={state.kind === 'sending'} className="bg-[#d6101c] px-5 text-white hover:opacity-90 disabled:opacity-60">
          <Send className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-[30px] mt-3 flex justify-center">
        <AntiSpamFields theme="dark" />
      </div>
      {state.kind === 'ok' && <p className="mt-3 text-[11px] text-[#39ff14]">{state.text}</p>}
      {state.kind === 'error' && <p className="mt-3 text-[11px] text-red-300">{state.text}</p>}
    </form>
  );
}
