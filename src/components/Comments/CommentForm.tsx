'use client';

import { useEffect, useState } from 'react';
import AntiSpamFields, { resetAntiSpam } from '@/components/Antispam/AntiSpamFields';

const REMEMBER_KEY = 'ec-comentario';
const input = 'w-full border border-gray-300 bg-white px-3 py-2 text-[14px] text-gray-800 outline-none focus:border-[#2E7C04]';

/** Formulário de comentário, no estilo do WordPress. Protegido por honeypot, tempo mínimo e Cloudflare Turnstile. */
export default function CommentForm({ slug }: { slug: string }) {
  const [values, setValues] = useState({ name: '', email: '', website: '', content: '' });
  const [remember, setRemember] = useState(false);
  const [state, setState] = useState<{ kind: 'idle' | 'sending' | 'ok' | 'error'; text?: string }>({ kind: 'idle' });

  // "Guardar o meu nome, email e site neste navegador" (como no WordPress).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(REMEMBER_KEY) || 'null') as { name?: string; email?: string; website?: string } | null;
      if (saved) {
        setValues((v) => ({ ...v, name: saved.name || '', email: saved.email || '', website: saved.website || '' }));
        setRemember(true);
      }
    } catch {
      /* sem dados guardados */
    }
  }, []);

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: 'sending' });
    try {
      const antispam = Object.fromEntries(new FormData(e.currentTarget).entries());
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...antispam, ...values, slug }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || 'Não foi possível enviar o comentário.');
      if (remember) localStorage.setItem(REMEMBER_KEY, JSON.stringify({ name: values.name, email: values.email, website: values.website }));
      else localStorage.removeItem(REMEMBER_KEY);
      setValues((v) => ({ ...v, content: '' }));
      setState({ kind: 'ok', text: data.message || 'Comentário recebido. Fica visível depois de aprovado.' });
    } catch (err) {
      setState({ kind: 'error', text: err instanceof Error ? err.message : 'Não foi possível enviar o comentário.' });
    } finally {
      resetAntiSpam();
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4" noValidate={false}>
      <p className="text-[13px] text-gray-500">
        O seu endereço de email não será publicado. Campos obrigatórios marcados com <span className="text-[#d6101c]">*</span>
      </p>

      <div>
        <label htmlFor="c-content" className="mb-1 block text-[13px] font-semibold text-gray-700">
          Comentário <span className="text-[#d6101c]">*</span>
        </label>
        <textarea id="c-content" required rows={7} maxLength={3000} value={values.content} onChange={set('content')} className={`${input} resize-y`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="mb-1 block text-[13px] font-semibold text-gray-700">
            Nome <span className="text-[#d6101c]">*</span>
          </label>
          <input id="c-name" required maxLength={80} autoComplete="name" value={values.name} onChange={set('name')} className={input} />
        </div>
        <div>
          <label htmlFor="c-email" className="mb-1 block text-[13px] font-semibold text-gray-700">
            Email <span className="text-[#d6101c]">*</span>
          </label>
          <input id="c-email" required type="email" maxLength={254} autoComplete="email" value={values.email} onChange={set('email')} className={input} />
        </div>
      </div>

      <div>
        <label htmlFor="c-site" className="mb-1 block text-[13px] font-semibold text-gray-700">
          Site
        </label>
        <input id="c-site" type="text" inputMode="url" maxLength={200} autoComplete="url" value={values.website} onChange={set('website')} className={input} />
      </div>

      <label className="flex items-start gap-2 text-[13px] text-gray-600">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="mt-0.5" />
        Guardar o meu nome, email e site neste navegador para a próxima vez que eu comentar.
      </label>

      <AntiSpamFields />

      {state.kind === 'ok' && <p className="border-l-4 border-[#2E7C04] bg-green-50 px-3 py-2 text-[13px] text-green-800">{state.text}</p>}
      {state.kind === 'error' && <p className="border-l-4 border-[#d6101c] bg-red-50 px-3 py-2 text-[13px] text-red-800">{state.text}</p>}

      <button
        type="submit"
        disabled={state.kind === 'sending'}
        className="bg-[#d6101c] px-5 py-2.5 text-[13px] font-bold text-white transition-colors hover:bg-[#a30c15] disabled:opacity-60"
      >
        {state.kind === 'sending' ? 'A enviar…' : 'Publicar comentário'}
      </button>
    </form>
  );
}
