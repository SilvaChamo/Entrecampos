'use client';

import { useState } from 'react';
import AntiSpamFields, { resetAntiSpam } from '@/components/Antispam/AntiSpamFields';

const input = 'w-full border border-gray-300 bg-white px-3 py-2 text-[14px] text-gray-800 outline-none focus:border-[#2E7C04]';

/** Formulário "Enviar mensagem" da página de contactos. Protegido por honeypot, tempo mínimo e Cloudflare Turnstile. */
export default function ContactForm({ embedded = false }: { embedded?: boolean }) {
  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '' });
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'ok' | 'error'; text?: string }>({ kind: 'idle' });
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: 'sending' });
    try {
      const antispam = Object.fromEntries(new FormData(e.currentTarget).entries());
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...antispam, ...values }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar a mensagem.');
      setValues({ name: '', email: '', subject: '', message: '' });
      setState({ kind: 'ok', text: data.message || 'Mensagem enviada. Obrigado pelo contacto!' });
    } catch (err) {
      setState({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível enviar a mensagem.' });
    } finally {
      resetAntiSpam();
    }
  }

  return (
    <form onSubmit={submit} className={embedded ? 'space-y-4' : 'mt-8 space-y-4 border-t border-gray-200 pt-6'}>
      <h2 className={embedded ? 'text-[22px] font-extrabold text-[#0c1f08]' : 'text-[18px] font-bold text-[#1a3d0c]'}>
        {embedded ? 'Pronto para começar?' : 'Enviar mensagem'}
      </h2>
      {embedded && <p className="-mt-2 text-[12px] text-gray-500">O seu email não será publicado. Os campos com <span className="text-[#d6101c]">*</span> são obrigatórios.</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="m-name" className="mb-1 block text-[13px] font-semibold text-gray-700">Nome <span className="text-[#d6101c]">*</span></label>
          <input id="m-name" required maxLength={80} autoComplete="name" value={values.name} onChange={set('name')} className={input} />
        </div>
        <div>
          <label htmlFor="m-email" className="mb-1 block text-[13px] font-semibold text-gray-700">Email <span className="text-[#d6101c]">*</span></label>
          <input id="m-email" required type="email" maxLength={254} autoComplete="email" value={values.email} onChange={set('email')} className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="m-subject" className="mb-1 block text-[13px] font-semibold text-gray-700">Assunto</label>
        <input id="m-subject" maxLength={150} value={values.subject} onChange={set('subject')} className={input} />
      </div>
      <div>
        <label htmlFor="m-message" className="mb-1 block text-[13px] font-semibold text-gray-700">Mensagem <span className="text-[#d6101c]">*</span></label>
        <textarea id="m-message" required rows={6} minLength={5} maxLength={4000} value={values.message} onChange={set('message')} className={`${input} resize-y`} />
      </div>

      <AntiSpamFields />

      {state.kind === 'ok' && <p className="border-l-4 border-[#2E7C04] bg-green-50 px-3 py-2 text-[13px] text-green-800">{state.text}</p>}
      {state.kind === 'error' && <p className="border-l-4 border-[#d6101c] bg-red-50 px-3 py-2 text-[13px] text-red-800">{state.text}</p>}

      <button type="submit" disabled={state.kind === 'sending'} className="bg-[#d6101c] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#a30c15] disabled:opacity-60">
        {state.kind === 'sending' ? 'A enviar…' : 'Enviar mensagem'}
      </button>
    </form>
  );
}
