'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, LayoutTemplate, RotateCcw, Save, X } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import AdminSelect from '@/components/Admin/AdminSelect';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import {
  HOME_CATEGORY_SLOTS,
  HOME_SECTIONS,
  HOME_ZONES,
  defaultHomeCategories,
  defaultHomeLayout,
  normalizeHomeCategories,
  normalizeHomeLayout,
  type HomeCategories,
  type HomeLayout,
  type HomeZone,
} from '@/lib/home-sections';

const LABEL = Object.fromEntries(HOME_SECTIONS.map((s) => [s.id, s.label])) as Record<string, string>;
const same = (a: HomeLayout, b: HomeLayout) => HOME_ZONES.every((z) => a[z.id].join() === b[z.id].join());
const sameCats = (a: HomeCategories, b: HomeCategories) => HOME_CATEGORY_SLOTS.every((s) => a[s.key].join() === b[s.key].join());
type State = { layout: HomeLayout; categories: HomeCategories };
type CategoryOption = { slug: string; label: string };

/** Secções da página inicial: as setas mudam a posição dentro da zona e o selector muda a categoria que cada secção mostra. */
export default function HomeSeccoesPage() {
  const first = adminCacheGet<State>('home-sections-v2');
  const [saved, setSaved] = useState<State | null>(first ?? null);
  const [draft, setDraft] = useState<State | null>(first ?? null);
  const layout = draft?.layout ?? null;
  const categories = draft?.categories ?? null;
  const setLayout = (fn: (cur: HomeLayout | null) => HomeLayout | null) =>
    setDraft((cur) => {
      const next = cur ? fn(cur.layout) : null;
      return cur && next ? { ...cur, layout: next } : cur;
    });
  const setCategory = (key: string, list: string[]) => {
    setDone(null);
    setDraft((cur) => (cur ? { ...cur, categories: { ...cur.categories, [key]: list } } : cur));
  };
  const [options, setOptions] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(!first);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/home-sections', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar as secções.');
        const st: State = { layout: normalizeHomeLayout(data.layout), categories: normalizeHomeCategories(data.categories) };
        adminCacheSet('home-sections-v2', st);
        setSaved(st);
        setDraft((cur) => cur ?? st);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar as secções.'))
      .finally(() => setLoading(false));
    fetch('/api/admin/categories', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setOptions(Array.isArray(data?.options) ? data.options : []))
      .catch(() => {});
  }, []);

  const changed = useMemo(() => !!draft && !!saved && (!same(draft.layout, saved.layout) || !sameCats(draft.categories, saved.categories)), [draft, saved]);

  /** Tira a secção de onde está e põe-na na zona e no lugar pedidos (lugar 0 = primeiro). */
  function move(id: string, zone: HomeZone, index: number) {
    setDone(null);
    setLayout((cur) => {
      if (!cur) return cur;
      const next = Object.fromEntries(HOME_ZONES.map((z) => [z.id, [...cur[z.id]]])) as HomeLayout;
      for (const z of HOME_ZONES) next[z.id] = next[z.id].filter((x) => x !== id);
      next[zone].splice(Math.max(0, Math.min(index, next[zone].length)), 0, id);
      return next;
    });
  }

  async function save(body: State | null) {
    setBusy(true);
    setError(null);
    setDone(null);
    try {
      const res = await fetch('/api/admin/home-sections', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body === null ? { layout: null, categories: null } : { layout: body.layout, categories: body.categories }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível guardar.');
      const st: State = { layout: normalizeHomeLayout(data.layout), categories: normalizeHomeCategories(data.categories) };
      adminCacheSet('home-sections-v2', st);
      setSaved(st);
      setDraft(st);
      setDone(body === null ? 'Posição e categorias de origem repostas' : 'Guardado: a página inicial já mostra a nova posição e as novas categorias');
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
            disabled={busy || !draft || (same(draft.layout, defaultHomeLayout()) && sameCats(draft.categories, defaultHomeCategories()))}
            onClick={() => confirm('Voltar à posição e às categorias de origem da página inicial?') && save(null)}
            className={`${btn} border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50`}
          >
            <RotateCcw className="h-4 w-4" /> Repor origem
          </button>
          <button
            type="button"
            disabled={busy || !changed}
            onClick={() => draft && save(draft)}
            className={`${btn} bg-[#00a651] text-white hover:bg-[#008f46]`}
          >
            {busy ? <Spinner size={16} /> : <Save className="h-4 w-4" />} Guardar
          </button>
        </div>
      </div>

      <p className="mb-4 text-[13px] text-gray-600">
        Use as setas para mudar a posição de cada secção e o selector para escolher a categoria que ela mostra. Só muda no site depois de guardar.
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
                      {categories && <CategoryControl section={id} categories={categories} options={options} onChange={setCategory} />}
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

/** Selector(es) de categoria de uma secção. Secções com várias categorias mostram-nas em etiquetas que se podem retirar, e o selector junta outra. */
function CategoryControl({ section, categories, options, onChange }: { section: string; categories: HomeCategories; options: CategoryOption[]; onChange: (key: string, list: string[]) => void }) {
  const slots = HOME_CATEGORY_SLOTS.filter((s) => s.section === section);
  if (slots.length === 0) return null;
  const labelOf = (slug: string) => options.find((o) => o.slug === slug)?.label ?? slug.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
  const field = 'h-9 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none';
  return (
    <div className="flex w-full flex-col gap-2 pl-8">
      {slots.map((slot) => {
        const list = categories[slot.key];
        const all = options.some((o) => o.slug === list[0]) || options.length === 0 ? options : [{ slug: list[0], label: labelOf(list[0]) }, ...options];
        return (
          <div key={slot.key} className="flex flex-wrap items-center gap-2">
            {slots.length > 1 && <span className="w-[110px] shrink-0 text-[13px] text-gray-500">{slot.label}</span>}
            {slot.multi ? (
              <>
                {list.map((slug) => (
                  <span key={slug} className="flex h-9 items-center gap-1.5 border border-[#ccd0d4] bg-[#f6f7f7] pl-3 pr-1 text-[13px] text-[#1d2327]">
                    {labelOf(slug)}
                    <button type="button" aria-label={`Retirar ${labelOf(slug)}`} disabled={list.length === 1} onClick={() => onChange(slot.key, list.filter((x) => x !== slug))} className="flex h-7 w-7 items-center justify-center text-gray-500 hover:text-[#d63638] disabled:cursor-not-allowed disabled:opacity-40">
                      <X className="h-4 w-4" />
                    </button>
                  </span>
                ))}
                <AdminSelect aria-label="Juntar categoria" value="" onChange={(e) => e.target.value && onChange(slot.key, [...list, e.target.value])} className="h-9 w-[210px] border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none">
                  <option value="">Juntar categoria…</option>
                  {options.filter((o) => !list.includes(o.slug)).map((o) => (
                    <option key={o.slug} value={o.slug}>{o.label}</option>
                  ))}
                </AdminSelect>
              </>
            ) : (
              <AdminSelect aria-label={`Categoria${slots.length > 1 ? ` (${slot.label.toLowerCase()})` : ''}`} value={list[0]} onChange={(e) => onChange(slot.key, [e.target.value])} className={`${field} sm:w-[260px]`}>
                {all.map((o) => (
                  <option key={o.slug} value={o.slug}>{o.label}</option>
                ))}
              </AdminSelect>
            )}
          </div>
        );
      })}
    </div>
  );
}
