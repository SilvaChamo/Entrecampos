'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import { dataEmTexto, precoEmTexto, subscricaoActiva, type Pedido, type Subscricao } from '@/lib/assinaturas-types';

type Assinante = { id: string; name: string; email: string; sub: Subscricao; active: boolean };
type Aba = 'pendente' | 'tratados' | 'assinantes';

/** Pedidos de subscrição dos leitores e lista de assinantes. */
export default function SubscricoesPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [assinantes, setAssinantes] = useState<Assinante[]>([]);
  const [aba, setAba] = useState<Aba>('pendente');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/subscricoes', { credentials: 'include' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao carregar.');
      setPedidos(d.pedidos);
      setAssinantes(d.assinantes);
      setErro(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function acao(corpo: Record<string, string>, confirmacao?: string) {
    if (confirmacao && !confirm(confirmacao)) return;
    setBusy(true);
    setErro(null);
    try {
      const res = await fetch('/api/admin/subscricoes', { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(corpo) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro.');
      await carregar();
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro.');
    } finally {
      setBusy(false);
    }
  }

  const pendentes = pedidos.filter((p) => p.status === 'pendente');
  const tratados = pedidos.filter((p) => p.status !== 'pendente');
  const abas: { k: Aba; t: string; n: number }[] = [
    { k: 'pendente', t: 'Pendentes', n: pendentes.length },
    { k: 'tratados', t: 'Tratados', n: tratados.length },
    { k: 'assinantes', t: 'Assinantes', n: assinantes.length },
  ];
  const lista = aba === 'pendente' ? pendentes : tratados;
  const btn = 'flex h-8 items-center gap-1 px-3 text-[12px] font-bold disabled:opacity-50';

  return (
    <div className="p-4 text-[#2c3338] sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1d2327]">Subscrições</h1>
          <p className="mt-1 max-w-xl text-[13px] text-[#50575e]">Quando um leitor paga e envia a referência, o pedido aparece aqui. Confirme o pagamento e carregue em <b>Aprovar</b>: a subscrição fica activa e as notícias exclusivas abrem.</p>
        </div>
        <div className="flex gap-2 text-[13px]">
          <Link href="/admin/subscricoes/planos" className="flex h-9 items-center border border-[#00a651] px-3 font-medium text-[#00a651] hover:bg-[#f0f7f4]">Planos e pagamento</Link>
          <Link href="/admin/subscricoes/exclusivas" className="flex h-9 items-center border border-[#00a651] px-3 font-medium text-[#00a651] hover:bg-[#f0f7f4]">Notícias exclusivas</Link>
        </div>
      </div>
      {erro && <p role="alert" className="mb-4 border-l-4 border-[#d63638] bg-[#fcf0f1] px-3 py-2 text-[13px]">{erro}</p>}
      <div className="mb-3 flex gap-1.5">
        {abas.map((a) => (
          <button key={a.k} onClick={() => setAba(a.k)} className={`h-8 px-3 text-[12px] font-bold ${aba === a.k ? 'bg-[#00a651] text-white' : 'border border-[#ccd0d4] bg-white hover:bg-[#f6f7f7]'}`}>{a.t} ({a.n})</button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center p-10"><Spinner size={26} className="" /></div>
      ) : aba === 'assinantes' ? (
        assinantes.length === 0 ? <p className="border border-[#ccd0d4] bg-white p-6 text-center text-[13px] text-[#50575e]">Ainda não há assinantes.</p> : (
          <ul className="space-y-2">
            {assinantes.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 border border-[#ccd0d4] bg-white p-3 text-[13px]">
                <div className="min-w-0"><b>{a.name}</b> <span className="text-[#50575e]">{a.email}</span><br /><span className="text-[12px] text-[#50575e]">{a.sub.planName} · {subscricaoActiva(a.sub) ? 'activa' : 'terminou'} {subscricaoActiva(a.sub) ? 'até' : 'a'} {dataEmTexto(a.sub.until)}</span></div>
                <button disabled={busy} onClick={() => acao({ action: 'revogar', userId: a.id }, `Retirar a subscrição de ${a.name}?`)} className={`${btn} border border-[#ccd0d4] text-[#d63638] hover:bg-[#fcf0f1]`}>Retirar acesso</button>
              </li>
            ))}
          </ul>
        )
      ) : lista.length === 0 ? (
        <p className="border border-[#ccd0d4] bg-white p-6 text-center text-[13px] text-[#50575e]">{aba === 'pendente' ? 'Não há pedidos a aguardar.' : 'Ainda não há pedidos tratados.'}</p>
      ) : (
        <ul className="space-y-2">
          {lista.map((p) => (
            <li key={p.id} className="border border-[#ccd0d4] bg-white p-3 text-[13px] sm:p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <b>{p.name}</b> <span className="text-[#50575e]">{p.email}</span>
                  <div className="mt-1">{p.planName} · {precoEmTexto({ price: p.price, months: p.months })}</div>
                  <div className="mt-1 text-[12px] text-[#50575e]">Referência: <b className="text-[#2c3338]">{p.reference}</b> · pedido a {dataEmTexto(p.createdAt)}{p.status !== 'pendente' && p.decidedAt ? ` · ${p.status === 'aprovado' ? 'aprovado' : 'rejeitado'} a ${dataEmTexto(p.decidedAt)}` : ''}</div>
                  {p.note && <div className="mt-1 text-[12px] text-[#d63638]">Motivo: {p.note}</div>}
                </div>
                {p.status === 'pendente' ? (
                  <div className="flex gap-2">
                    <button disabled={busy} onClick={() => acao({ action: 'aprovar', id: p.id })} className={`${btn} bg-[#00a651] text-white hover:bg-[#008f45]`}><Check className="h-4 w-4" /> Aprovar</button>
                    <button disabled={busy} onClick={() => { const note = prompt('Motivo (opcional, o leitor vê):') ?? null; if (note !== null) acao({ action: 'rejeitar', id: p.id, note }); }} className={`${btn} border border-[#ccd0d4] text-[#d63638] hover:bg-[#fcf0f1]`}><X className="h-4 w-4" /> Rejeitar</button>
                  </div>
                ) : (
                  <span className={`px-2 py-1 text-[11px] font-bold uppercase ${p.status === 'aprovado' ? 'bg-[#f0f7f4] text-[#00a651]' : 'bg-[#fcf0f1] text-[#d63638]'}`}>{p.status}</span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
