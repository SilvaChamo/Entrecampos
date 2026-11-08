'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import type { Plano } from '@/lib/assinaturas-types';

const input = 'h-9 w-full border border-[#8c8f94] bg-white px-2 text-[13px] focus:border-[#00a651] focus:outline-none';
const novoId = () => Math.random().toString(36).slice(2, 10);

/** Planos de subscrição (nome, preço, duração) e instruções de pagamento mostradas ao leitor. */
export default function PlanosAdminPage() {
  const [plans, setPlans] = useState<Plano[]>([]);
  const [payment, setPayment] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/planos', { credentials: 'include' });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao carregar os planos.');
      setPlans(d.plans);
      setPayment(d.payment || '');
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao carregar os planos.' });
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  const mudar = (id: string, parte: Partial<Plano>) => { setPlans((l) => l.map((p) => (p.id === id ? { ...p, ...parte } : p))); setDirty(true); setMsg(null); };

  async function guardar() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/admin/planos', { method: 'PUT', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plans, payment }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Erro ao guardar.');
      setPlans(d.plans);
      setPayment(d.payment || '');
      setDirty(false);
      setMsg({ tipo: 'ok', texto: 'Planos guardados. Já aparecem em /planos.' });
    } catch (err) {
      setMsg({ tipo: 'erro', texto: err instanceof Error ? err.message : 'Erro ao guardar.' });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex justify-center p-12"><Spinner size={28} className="" /></div>;

  return (
    <div className="p-4 text-[#2c3338] sm:p-6">
      <Link href="/admin/subscricoes" className="mb-3 inline-flex items-center gap-1 text-[13px] text-[#00a651] hover:underline"><ArrowLeft className="h-4 w-4" /> Subscrições</Link>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#1d2327]">Planos e pagamento</h1>
          <p className="mt-1 max-w-xl text-[13px] text-[#50575e]">Defina os planos à venda. Um plano sem preço aparece como “Brevemente” e ainda não se pode pedir.</p>
        </div>
        <button onClick={guardar} disabled={busy || !dirty} className="flex h-9 items-center gap-1.5 bg-[#00a651] px-4 text-[13px] font-medium text-white hover:bg-[#008f45] disabled:opacity-50"><Save className="h-4 w-4" /> {busy ? 'A guardar…' : 'Guardar'}</button>
      </div>
      {msg && <p role="status" className={`mb-4 border-l-4 px-3 py-2 text-[13px] ${msg.tipo === 'ok' ? 'border-[#00a651] bg-[#f0f7f4]' : 'border-[#d63638] bg-[#fcf0f1]'}`}>{msg.texto}</p>}

      <ul className="space-y-3">
        {plans.map((p) => (
          <li key={p.id} className={`border border-[#ccd0d4] bg-white p-3 sm:p-4 ${p.active ? '' : 'opacity-60'}`}>
            <div className="grid gap-3 sm:grid-cols-[1fr_130px_110px]">
              <label className="text-[11px] font-bold uppercase text-[#50575e]">Nome<input value={p.name} maxLength={60} onChange={(e) => mudar(p.id, { name: e.target.value })} className={`${input} mt-1`} /></label>
              <label className="text-[11px] font-bold uppercase text-[#50575e]">Preço (MT)<input type="number" min={0} value={p.price ?? ''} placeholder="a anunciar" onChange={(e) => mudar(p.id, { price: e.target.value === '' ? null : Number(e.target.value) })} className={`${input} mt-1`} /></label>
              <label className="text-[11px] font-bold uppercase text-[#50575e]">Meses<input type="number" min={1} max={36} value={p.months} onChange={(e) => mudar(p.id, { months: Number(e.target.value) })} className={`${input} mt-1`} /></label>
            </div>
            <label className="mt-3 block text-[11px] font-bold uppercase text-[#50575e]">Descrição curta<input value={p.description ?? ''} maxLength={120} onChange={(e) => mudar(p.id, { description: e.target.value })} className={`${input} mt-1`} /></label>
            <label className="mt-3 block text-[11px] font-bold uppercase text-[#50575e]">O que inclui (uma linha por ponto)
              <textarea rows={3} value={p.features.join('\n')} onChange={(e) => mudar(p.id, { features: e.target.value.split('\n') })} className="mt-1 w-full border border-[#8c8f94] bg-white p-2 text-[13px] font-normal normal-case text-[#2c3338] focus:border-[#00a651] focus:outline-none" />
            </label>
            <div className="mt-3 flex items-center justify-end gap-3">
              <label className="flex cursor-pointer items-center gap-1.5 text-[12px]"><input type="checkbox" checked={p.active} onChange={(e) => mudar(p.id, { active: e.target.checked })} className="accent-[#00a651]" /> À venda</label>
              <button onClick={() => { if (confirm(`Remover o plano "${p.name}"?`)) { setPlans((l) => l.filter((x) => x.id !== p.id)); setDirty(true); } }} aria-label="Remover plano" className="flex h-8 w-8 items-center justify-center border border-[#ccd0d4] text-[#d63638] hover:bg-[#fcf0f1]"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      <button onClick={() => { setPlans((l) => [...l, { id: novoId(), name: '', price: null, months: 1, features: [], active: true }]); setDirty(true); }} className="mt-3 flex h-8 items-center gap-1 border border-[#00a651] bg-white px-3 text-[12px] font-bold text-[#00a651] hover:bg-[#f0f7f4]"><Plus className="h-4 w-4" /> Novo plano</button>

      <div className="mt-6 border border-[#ccd0d4] bg-white p-3 sm:p-4">
        <label className="block text-[11px] font-bold uppercase text-[#50575e]">Como pagar (o leitor vê isto antes de enviar a referência)
          <textarea rows={5} maxLength={600} value={payment} onChange={(e) => { setPayment(e.target.value); setDirty(true); setMsg(null); }} placeholder={'Ex.:\nM-Pesa: 84 000 0000 (EntreCAMPOS)\ne-Mola: 86 000 0000\nTransferência: NIB 0000 0000 0000'} className="mt-1 w-full border border-[#8c8f94] bg-white p-2 text-[13px] font-normal normal-case text-[#2c3338] focus:border-[#00a651] focus:outline-none" />
        </label>
      </div>
    </div>
  );
}
