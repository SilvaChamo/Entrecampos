'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
const GREEN = '#00a651';
import { dataEmTexto, diasAte, type Exclusiva, type Pedido, type Plano } from '@/lib/assinaturas-types';

type Estado = {
  user: { name: string; email: string; role: string };
  subscription: { planName: string; since: string; until: string; active: boolean } | null;
  pedido: Pedido | null;
  plans: Plano[];
  payment: string;
  exclusivas: Exclusiva[];
};

const caixa = 'bg-white p-5 shadow-sm sm:p-6';
const titulo = 'text-[13px] font-bold uppercase tracking-wide';

/** Área de assinantes: estado da subscrição, pedido de subscrição/renovação e notícias exclusivas. */
export default function AreaAssinante() {
  const router = useRouter();
  const [e, setE] = useState<Estado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/assinatura', { credentials: 'include', cache: 'no-store' });
      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent('/assinante')}`);
        return;
      }
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao carregar a sua área.');
      setE(d);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar a sua área.');
    }
  }, [router]);

  useEffect(() => { carregar(); }, [carregar]);

  async function sair() {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch { /* sem rede */ }
    window.location.assign('/');
  }

  if (!e) return <div className={caixa}><p className="text-sm text-neutral-500">{erro || 'A carregar a sua área…'}</p></div>;

  const sub = e.subscription;
  const activa = !!sub?.active;
  const faltam = sub ? diasAte(sub.until) : 0;
  const pendente = e.pedido?.status === 'pendente' ? e.pedido : null;
  const recusado = e.pedido?.status === 'rejeitado' ? e.pedido : null;
  const redaccao = e.user.role !== 'guest';

  return (
    <div className="space-y-5">
      <div className={`${caixa} flex flex-wrap items-center justify-between gap-3`}>
        <div className="min-w-0">
          <div className={titulo} style={{ color: GREEN }}>Área de assinantes</div>
          <h1 className="mt-1 text-xl font-extrabold text-[#0b5c2e]">Olá, {e.user.name}</h1>
          <p className="text-xs text-neutral-500">{e.user.email}</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-wide">
          {redaccao ? <Link href="/admin" className="border px-3 py-2" style={{ borderColor: GREEN, color: GREEN }}>Ir para o painel</Link> : <Link href="/admin/guest" className="border px-3 py-2" style={{ borderColor: GREEN, color: GREEN }}>Painel de visitante</Link>}
          <button onClick={sair} className="bg-neutral-200 px-3 py-2 text-neutral-700 hover:bg-neutral-300">Terminar sessão</button>
        </div>
      </div>

      <div className={caixa}>
        <h2 className={titulo} style={{ color: GREEN }}>A sua subscrição</h2>
        {redaccao ? (
          <p className="mt-2 text-sm text-neutral-700">Faz parte da redacção: tem acesso a todas as notícias exclusivas.</p>
        ) : activa && sub ? (
          <>
            <p className="mt-2 text-sm text-neutral-700"><b>{sub.planName}</b> · activa até <b>{dataEmTexto(sub.until)}</b></p>
            {faltam <= 7 && <p className="mt-2 border-l-4 border-[#dba617] bg-[#fcf9e8] px-3 py-2 text-[13px]">A subscrição termina {faltam <= 1 ? 'amanhã' : `em ${faltam} dias`}. Renove abaixo para não perder o acesso.</p>}
          </>
        ) : sub ? (
          <p className="mt-2 text-sm text-neutral-700">A sua subscrição <b>{sub.planName}</b> terminou a {dataEmTexto(sub.until)}. Renove abaixo para voltar a ler as exclusivas.</p>
        ) : (
          <p className="mt-2 text-sm text-neutral-700">Ainda não tem subscrição. Escolha um plano para ler as notícias exclusivas.</p>
        )}
        {pendente && <p className="mt-3 border-l-4 bg-[#eaf3ed] px-3 py-2 text-[13px]" style={{ borderColor: GREEN }}>Pedido de <b>{pendente.planName}</b> enviado a {dataEmTexto(pendente.createdAt)} (referência {pendente.reference}). Estamos a confirmar o pagamento.</p>}
        {recusado && !pendente && <p className="mt-3 border-l-4 border-[#d63638] bg-[#fcf0f1] px-3 py-2 text-[13px]">O seu último pedido ({recusado.planName}) não foi aceite{recusado.note ? `: ${recusado.note}` : ''}. Pode escolher um plano e enviar um novo pedido.</p>}
      </div>

      {!redaccao && !pendente && (
        <div className={`${caixa} flex flex-wrap items-center justify-between gap-3`}>
          <div>
            <h2 className={titulo} style={{ color: GREEN }}>{activa ? 'Renovar subscrição' : 'Escolher um plano'}</h2>
            <p className="mt-1 text-[13px] text-neutral-600">{activa ? 'O tempo que resta é somado ao novo período.' : 'Escolha um plano e finalize o pagamento.'}</p>
          </div>
          <Link href="/planos" className="px-6 py-3 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: '#0b5c2e' }}>Ver planos</Link>
        </div>
      )}

      <div className={caixa}>
        <h2 className={titulo} style={{ color: GREEN }}>Últimas notícias exclusivas</h2>
        {e.exclusivas.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">Ainda não há notícias exclusivas publicadas.</p>
        ) : (
          <ul className="mt-2">
            {e.exclusivas.map((x) => (
              <li key={x.slug} className="flex items-baseline justify-between gap-3 border-b border-neutral-100 py-2.5 text-[13px] last:border-0">
                <Link href={`/noticias/${x.slug}`} className="min-w-0 font-semibold hover:text-[#008f45]">{x.title}</Link>
                <span className="shrink-0 text-[11px] text-neutral-500">{x.category}</span>
              </li>
            ))}
          </ul>
        )}
        {!activa && !redaccao && <p className="mt-3 text-xs text-neutral-500">Sem subscrição activa, vê só o início de cada notícia exclusiva.</p>}
      </div>
    </div>
  );
}
