'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, LayoutTemplate, RotateCcw, Save } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import AdminSelect from '@/components/Admin/AdminSelect';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import { HOME_SECTIONS, HOME_ZONES, defaultHomeLayout, normalizeHomeLayout, type HomeLayout, type HomeZone } from '@/lib/home-sections';

const LABEL = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s.label])) as Record<string, string>;
const same = (a: HomeLayout, b: HomeLayout) => HOME_ZONES.every((z) => a[z.id].join() === b[z.id].join());

/** Posição das secções da página inicial: cada uma pode ir para qualquer zona e qualquer lugar. */
export default function HomeSeccoesPage() {
  const first = adminCacheGet<HomeLayout>('home-layout');
  const [saved, setSaved] = useState<HomeLayout | null>(first ?? null);
  const [layout, setLayout] = useState<HomeLayout | null>(first ?? null);
  const [loading, setLoading] = useState(!first);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/home-sections', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar as secções.');
        const l = normalizeHomeLayout(data.layout);
        adminCacheSet('home-layout', l);
        setSaved(l);
        setLayout((cur) => cur ?? l);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar as secções.'))
      .finally(() => setLoading(false));
  }, []);

  const changed = useMemo(() => !!layout && !!saved && !same(layout, saved), [layout, saved]);

  /** Tira a secção de onde está e põe-na na zona e no lugar pedidos (lugar 0 = primeiro). */
  function move(id: string, zone: HomeZone, index: number) {
    setDone(null);
    setLayout((cur) => {
      if (!cur) return cur;
      const next = { top: [...cur.top], main: [...cur.main], side: [...cur.side], bottom: [...cur.bottom] } as HomeLayout;
      for (const z of HOME_ZONES) next[z.id] = next[z.id].filter((x) => x !== id);
      next[zone].splice(Math.max(0, Math.min(index, next[zone].length)), 0, id);
      return next;
    });
  }

  async function save(body: HomeLayout | null) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch('/api/admin/home-sections', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível guardar.');
      const l = normalizeHomeLayout(data.layout);
      adminCacheSet('home-layout', l);
      setSaved(l);
      setLayout(l);
      setDone(body === null ? 'Ordem de origem reposta.' : 'Guardado. A página inicial já mostra a nova ordem.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setBusy(false);
    }
  }

  const arrow = 'flex h-9 w-9 shrink-0 items-center justify-center border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';
  const btn = 'flex h-9 items-center gap-1.5 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60';

  return (
    <div className="ec-page text-[#2c3338]">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-[23px] font-normal text-[#1d2327]">
          <LayoutTemplate className="h-5 w-5 text-gray-500" /> Secções da página inicial
        </h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !layout || same(layout, defaultHomeLayout())}
            onClick={() => confirm('Voltar à ordem de origem da página inicial?') && save(null)}
            className={`${btn} border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50`}
          >
            <RotateCcw className="h-4 w-4" /> Repor ordem de origem
          </button>
          <button
            type="button"
            disabled={busy || !changed}
            onClick={() => layout && save(layout)}
            className={`${btn} bg-[#00a651] text-white hover:bg-[#008f46]`}
          >
            {busy ? <Spinner size={16} /> : <Save className="h-4 w-4" />} Guardar
          </button>
        </div>
      </div>

      <p className="mb-4 text-[13px] text-gray-600">
        Escolha a zona e o lugar de cada secção, ou use as setas. A ordem só muda no site depois de guardar.
      </p>

      {error && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</p>}
      {done && <p className="mb-4 border-l-4 border-[#00a651] bg-green-50 px-3 py-2 text-[13px] text-green-800">{done}</p>}

      {loading && !layout ? (
        <div className="flex min-h-[calc(100vh-200px)] items-center justify-center"><Spinner size={40} /></div>
      ) : layout ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {HOME_ZONES.map((zone) => (
            <section key={zone.id} className="border border-[#ccd0d4] bg-white">
              <header className="border-b border-[#e5e5e5] px-4 py-3">
                <h2 className="text-[14px] text-[#1d2327]">{zone.label}</h2>
                <p className="text-[12px] text-gray-500">{zone.hint}</p>
              </header>
              {layout[zone.id].length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-gray-500">Nenhuma secção nesta zona.</p>
              ) : (
                <ul className="divide-y divide-[#e5e5e5]">
                  {layout[zone.id].map((id, i) => (
                    <li key={id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                      <span className="w-6 shrink-0 text-[13px] text-gray-400">{i + 1}</span>
                      <span className="min-w-0 flex-1 basis-[180px] text-[13px] text-[#1d2327]">{LABEL[id]}</span>
                      <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => move(id, zone.id, i - 1)} className={arrow}>
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button type="button" aria-label="Descer" disabled={i === layout[zone.id].length - 1} onClick={() => move(id, zone.id, i + 1)} className={arrow}>
                        <ArrowDown className="h-4 w-4" />
                      </button>
                      <AdminSelect
                        aria-label="Zona"
                        value={zone.id}
                        onChange={(e) => move(id, e.target.value as HomeZone, layout[e.target.value as HomeZone].length)}
                        className="h-9 w-[150px] border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none"
                      >
                        {HOME_ZONES.map((z) => (
                          <option key={z.id} value={z.id}>{z.label}</option>
                        ))}
                      </AdminSelect>
                      <AdminSelect
                        aria-label="Lugar"
                        value={i}
                        onChange={(e) => move(id, zone.id, Number(e.target.value))}
                        className="h-9 w-[84px] border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none"
                      >
                        {layout[zone.id].map((_, n) => (
                          <option key={n} value={n}>{n + 1}º</option>
                        ))}
                      </AdminSelect>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
