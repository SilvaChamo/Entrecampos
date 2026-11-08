'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const GREEN = '#00a651';
import { dataEmTexto, precoEmTexto, type Pedido, type Plano } from '@/lib/assinaturas-types';

type Estado = { user: { name: string; role: string }; pedido: Pedido | null; plans: Plano[]; payment: string };

const caixa = 'bg-white p-5 shadow-sm sm:p-6';
const titulo = 'text-[13px] font-bold uppercase tracking-wide';
const botao = 'px-6 py-3 text-[11px] font-bold uppercase tracking-wide text-white';

/** Pagamento de um plano: resumo, instruções, referência da transferência e envio do pedido. */
export default function Checkout({ planoId }: { planoId: string }) {
  const router = useRouter();
  const [e, setE] = useState<Estado | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [referencia, setReferencia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const res = await fetch('/api/assinatura', { credentials: 'include', cache: 'no-store' });
        if (res.status === 401) {
          router.replace(`/login?next=${encodeURIComponent(`/checkout?plano=${planoId}`)}`);
          return;
        }
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Erro ao carregar o pagamento.');
        if (!vivo) return;
        if (!d.plans.some((p: Plano) => p.id === planoId && p.price != null)) { router.replace('/planos'); return; }
        setE(d);
      } catch (err) {
        if (vivo) setErro(err instanceof Error ? err.message : 'Erro ao carregar o pagamento.');
      }
    })();
    return () => { vivo = false; };
  }, [router, planoId]);

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch('/api/assinatura', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ planId: planoId, reference: referencia }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Não foi possível enviar o pedido.');
      setEnviado(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível enviar o pedido.');
    } finally {
      setEnviando(false);
    }
  }

  if (!e) return <div className={caixa}><p className="text-sm text-neutral-500">{erro || 'A preparar o pagamento…'}</p></div>;

  const plano = e.plans.find((p) => p.id === planoId)!;
  const pendente = e.pedido?.status === 'pendente' ? e.pedido : null;

  if (enviado || pendente) {
    const p = pendente ?? e.pedido;
    return (
      <div className={caixa}>
        <h1 className="text-xl font-extrabold text-[#0b5c2e]">Pedido recebido</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-700">
          {p ? <>Recebemos o pedido de <b>{p.planName}</b> com a referência <b>{p.reference}</b>.</> : 'Recebemos o seu pedido.'} Assim que confirmarmos o pagamento, a subscrição fica activa e passa a ler as notícias exclusivas.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/assinante" className={botao} style={{ background: '#0b5c2e' }}>Ir para a minha área</Link>
          <Link href="/" className="border px-6 py-3 text-[11px] font-bold uppercase tracking-wide" style={{ borderColor: GREEN, color: GREEN }}>Voltar à página inicial</Link>
        </div>
      </div>
    );
  }

  if (e.user.role !== 'guest') {
    return (
      <div className={caixa}>
        <h1 className="text-xl font-extrabold text-[#0b5c2e]">Não precisa de subscrição</h1>
        <p className="mt-2 text-sm text-neutral-700">Faz parte da redacção e já tem acesso a todas as notícias exclusivas.</p>
        <Link href="/" className={`${botao} mt-4 inline-block`} style={{ background: '#0b5c2e' }}>Voltar à página inicial</Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="space-y-5">
      <div className={caixa}>
        <div className={titulo} style={{ color: GREEN }}>Finalizar subscrição</div>
        <h1 className="mt-1 text-xl font-extrabold text-[#0b5c2e]">{plano.name}</h1>
        <p className="mt-1 text-lg font-extrabold text-neutral-900">{precoEmTexto(plano)}</p>
        <ul className="mt-3 space-y-1.5 text-[13px]">
          {plano.features.map((f) => <li key={f} className="flex gap-2"><span aria-hidden style={{ color: GREEN }}>✓</span><span>{f}</span></li>)}
        </ul>
        <Link href="/planos" className="mt-3 inline-block text-xs font-semibold hover:underline" style={{ color: GREEN }}>Escolher outro plano</Link>
      </div>

      <div className={caixa}>
        <h2 className={titulo} style={{ color: GREEN }}>Como pagar</h2>
        <p className="mt-2 whitespace-pre-line text-[13px] leading-relaxed text-neutral-700">{e.payment || 'As instruções de pagamento serão indicadas em breve.'}</p>
        <p className="mt-3 text-xs text-neutral-500">Depois de pagar, escreva abaixo a referência (por exemplo, o código da transacção). Confirmamos e activamos a subscrição de {e.user.name}.</p>
        <label className="mt-4 block text-[11px] font-bold uppercase text-neutral-500">
          Referência do pagamento
          <input value={referencia} onChange={(ev) => setReferencia(ev.target.value)} maxLength={80} required minLength={3} placeholder="Ex.: código M-Pesa" className="mt-1 h-10 w-full border border-neutral-300 px-3 text-sm font-normal normal-case text-neutral-800" />
        </label>
        {erro && <p className="mt-3 text-[13px] text-red-600">{erro}</p>}
        <button disabled={enviando} className={`${botao} mt-4 disabled:opacity-50`} style={{ background: '#0b5c2e' }}>{enviando ? 'A enviar…' : 'Confirmar pedido'}</button>
      </div>
    </form>
  );
}
