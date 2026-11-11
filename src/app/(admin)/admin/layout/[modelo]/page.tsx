'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronDown, ExternalLink, LayoutTemplate, RotateCcw, Save } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import AdminSelect from '@/components/Admin/AdminSelect';
import Slide from '@/components/Admin/Slide';
import { SECTION_LAYOUTS, type SectionLayout } from '@/lib/home-sections';
import {
  INNER_PAGES,
  SIDEBAR_BLOCKS,
  defaultInnerLayout,
  normalizeInnerLayout,
  sameInnerLayout,
  type InnerExtra,
  type InnerLayout,
  type InnerPageKey,
  type SidebarBlock,
} from '@/lib/inner-layout';

const SLUG_TO_KEY: Record<string, InnerPageKey> = { interiores: 'interior', categorias: 'categoria', leitura: 'leitura' };
/** Onde se vê o resultado de cada modelo no site. */
const PREVIEW: Record<InnerPageKey, string> = { interior: '/planos', categoria: '/noticias', leitura: '/noticias' };

const field = 'h-9 w-full border border-[#ccd0d4] bg-white px-3 text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none';
const fieldHalf = field.replace('w-full', 'w-full sm:w-1/2');
const arrow = 'flex h-8 w-8 shrink-0 items-center justify-center border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40';
const btn = 'flex h-9 items-center gap-1.5 px-4 text-[13px] disabled:cursor-not-allowed disabled:opacity-60';
const row = 'flex w-full items-center gap-3';
const label = 'w-[130px] shrink-0 text-[13px] text-gray-500';
const hint = 'text-[12px] text-gray-500';

export default function LayoutModeloPage() {
  const { modelo } = useParams<{ modelo: string }>();
  const key = SLUG_TO_KEY[modelo];
  const page = INNER_PAGES.find((p) => p.key === key);

  const [saved, setSaved] = useState<InnerLayout | null>(null);
  const [draft, setDraft] = useState<InnerLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [openBlocks, setOpenBlocks] = useState<string[]>([]); // blocos da barra lateral com as opções abertas
  const [extraOpen, setExtraOpen] = useState(true);
  const [categories, setCategories] = useState<{ slug: string; label: string }[]>([]);

  useEffect(() => {
    fetch('/api/admin/inner-layout', { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar o layout.');
        const st = normalizeInnerLayout(data.layout);
        setSaved(st);
        setDraft(st);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar o layout.'))
      .finally(() => setLoading(false));
    fetch('/api/admin/categories', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCategories(Array.isArray(data?.options) ? data.options : []))
      .catch(() => {});
  }, []);

  const changed = useMemo(() => !!draft && !!saved && !sameInnerLayout(draft, saved), [draft, saved]);

  if (!page || !key) return <p className="text-[13px] text-gray-600">Modelo de layout desconhecido.</p>;

  const cfg = draft?.[key];
  const edit = (fn: (c: NonNullable<typeof cfg>) => NonNullable<typeof cfg>) => {
    setDone('');
    setDraft((cur) => (cur ? { ...cur, [key]: fn(cur[key]) } : cur));
  };
  const setExtra = (patch: Partial<InnerExtra>) => edit((c) => ({ ...c, extra: { ...c.extra, ...patch } }));

  // Blocos ligados pela ordem escolhida, e os desligados a seguir.
  const on = cfg?.sidebar ?? [];
  const all: SidebarBlock[] = [...on, ...SIDEBAR_BLOCKS.map((b) => b.id).filter((id) => !on.includes(id))];
  const toggle = (id: SidebarBlock) => edit((c) => ({ ...c, sidebar: c.sidebar.includes(id) ? c.sidebar.filter((x) => x !== id) : [...c.sidebar, id] }));
  const move = (id: SidebarBlock, by: -1 | 1) =>
    edit((c) => {
      const list = [...c.sidebar];
      const i = list.indexOf(id);
      const j = i + by;
      if (i < 0 || j < 0 || j >= list.length) return c;
      [list[i], list[j]] = [list[j], list[i]];
      return { ...c, sidebar: list };
    });

  const save = async (value: InnerLayout | null) => {
    setBusy(true);
    setError('');
    setDone('');
    try {
      const res = await fetch('/api/admin/inner-layout', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: value }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível guardar.');
      const st = normalizeInnerLayout(data.layout);
      setSaved(st);
      setDraft(st);
      setDone(value === null ? 'Voltou ao modelo de origem.' : 'Guardado. O site já mostra o novo layout.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível guardar.');
    } finally {
      setBusy(false);
    }
  };

  const extra = cfg?.extra;
  const catLabel = (slug: string) => categories.find((c) => c.slug === slug)?.label ?? slug;

  return (
    <div className="ec-page ec-slide-popups text-[#2c3338]">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h1 className="flex items-center gap-2 text-[23px] font-normal text-[#1d2327]">
          <LayoutTemplate className="h-5 w-5 text-gray-500" /> Layout · {page.label}
        </h1>
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={PREVIEW[key]} target="_blank" rel="noopener noreferrer" className={`${btn} border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50`}>
            <ExternalLink className="h-4 w-4" /> Ver no site
          </a>
          <button
            type="button"
            disabled={busy || !draft || !saved || sameInnerLayout({ ...saved, [key]: defaultInnerLayout()[key] }, saved)}
            onClick={() => confirm(`Voltar ao modelo de origem de «${page.label}»?`) && saved && save({ ...saved, [key]: defaultInnerLayout()[key] })}
            className={`${btn} border border-[#ccd0d4] bg-white text-[#2c3338] hover:bg-gray-50`}
          >
            <RotateCcw className="h-4 w-4" /> Repor origem
          </button>
          <button type="button" disabled={busy || !changed} onClick={() => draft && save(draft)} className={`${btn} bg-[#00a651] text-white hover:bg-[#008f46]`}>
            {busy ? <Spinner size={16} /> : <Save className="h-4 w-4" />} Guardar
          </button>
        </div>
      </div>
      <p className="mb-4 text-[13px] text-gray-500">{page.hint}</p>

      {error && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-[13px] text-red-800">{error}</p>}
      {done && <p className="mb-4 border-l-4 border-[#00a651] bg-green-50 px-3 py-2 text-[13px] text-green-800">{done}</p>}

      {loading || !cfg || !extra ? (
        <div className="flex justify-center py-16"><Spinner size={28} className="" /></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="border border-[#ccd0d4] bg-white p-4">
            <h2 className="text-[15px] font-semibold text-[#1d2327]">Barra lateral</h2>
            <p className={`${hint} mb-3`}>Abra cada bloco para o mostrar ou ocultar e use as setas para mudar a ordem (de cima para baixo).</p>
            <ul className="divide-y divide-[#e5e7eb] border border-[#e5e7eb]">
              {all.map((id) => {
                const b = SIDEBAR_BLOCKS.find((x) => x.id === id)!;
                const index = on.indexOf(id);
                const enabled = index >= 0;
                return (
                  <li key={id} className={enabled ? '' : 'bg-gray-50'}>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <button
                        type="button"
                        aria-label={`${openBlocks.includes(id) ? 'Fechar' : 'Abrir'} as opções de ${b.label}`}
                        aria-expanded={openBlocks.includes(id)}
                        onClick={() => setOpenBlocks((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]))}
                        className={arrow}
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${openBlocks.includes(id) ? 'rotate-180' : ''}`} />
                      </button>
                      <div className="min-w-0 flex-1">
                        <span className={`block text-[13px] ${enabled ? 'text-[#1d2327]' : 'text-gray-400'}`}>{b.label}{enabled ? '' : ' (oculto)'}</span>
                        <span className="block text-[12px] text-gray-500">{b.hint}</span>
                      </div>
                      {enabled && (
                        <>
                          <button type="button" aria-label={`Subir ${b.label}`} disabled={index === 0} onClick={() => move(id, -1)} className={arrow}><ArrowUp className="h-4 w-4" /></button>
                          <button type="button" aria-label={`Descer ${b.label}`} disabled={index === on.length - 1} onClick={() => move(id, 1)} className={arrow}><ArrowDown className="h-4 w-4" /></button>
                        </>
                      )}
                    </div>
                    <Slide open={openBlocks.includes(id)}>
                      <div className={`${row} px-3 pb-3`}>
                        <span className={label}>Na barra lateral</span>
                        <AdminSelect aria-label={`Mostrar ${b.label}`} value={enabled ? 'sim' : 'nao'} onChange={(e) => (e.target.value === 'sim') !== enabled && toggle(id)} className={fieldHalf}>
                          <option value="sim">Mostrar</option>
                          <option value="nao">Não mostrar</option>
                        </AdminSelect>
                      </div>
                    </Slide>
                  </li>
                );
              })}
            </ul>
            {on.length === 0 && <p className={`${hint} mt-2`}>Sem blocos: a página usa a largura toda, sem barra lateral.</p>}
          </section>

          {page.extra && (
            <section className="border border-[#ccd0d4] bg-white p-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`${extraOpen ? 'Fechar' : 'Abrir'} as opções da secção no meio das notícias`}
                  aria-expanded={extraOpen}
                  onClick={() => setExtraOpen((o) => !o)}
                  className={arrow}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${extraOpen ? 'rotate-180' : ''}`} />
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[15px] font-semibold text-[#1d2327]">Secção no meio das notícias{extra.enabled ? '' : ' (desligada)'}</h2>
                  <p className={hint}>
                    {key === 'leitura' ? 'Acrescenta uma secção de notícias dentro do texto da notícia.' : 'Acrescenta uma secção de notícias entre os cards da página.'}
                  </p>
                </div>
              </div>
              <Slide open={extraOpen}>
              <div className={`${row} mt-3`}>
                <span className={label}>Secção</span>
                <AdminSelect aria-label="Acrescentar secção no meio" value={extra.enabled ? 'sim' : 'nao'} onChange={(e) => setExtra({ enabled: e.target.value === 'sim' })} className={fieldHalf}>
                  <option value="nao">Desligada</option>
                  <option value="sim">Ligada</option>
                </AdminSelect>
              </div>
              {extra.enabled && (
                <div className="mt-2 w-full space-y-2">
                  <div className={row}>
                    <span className={label}>Categoria</span>
                    <AdminSelect aria-label="Categoria da secção" value={extra.category} onChange={(e) => setExtra({ category: e.target.value })} className={fieldHalf}>
                      <option value="ultimas">Últimas notícias (todas)</option>
                      {categories.map((c) => (
                        <option key={c.slug} value={c.slug}>{c.label}</option>
                      ))}
                      {extra.category !== 'ultimas' && !categories.some((c) => c.slug === extra.category) && <option value={extra.category}>{catLabel(extra.category)}</option>}
                    </AdminSelect>
                  </div>
                  <div className={row}>
                    <span className={label}>Layout</span>
                    <AdminSelect aria-label="Layout da secção" value={extra.layout} onChange={(e) => setExtra({ layout: e.target.value as SectionLayout })} className={fieldHalf}>
                      {SECTION_LAYOUTS.map((l) => (
                        <option key={l.id} value={l.id}>{l.label}</option>
                      ))}
                    </AdminSelect>
                  </div>
                  {extra.layout === 'grelha' && (
                    <>
                      <div className={row}>
                        <span className={label}>Linhas</span>
                        <AdminSelect aria-label="Linhas de cards" value={String(extra.rows)} onChange={(e) => setExtra({ rows: Number(e.target.value) })} className={fieldHalf}>
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={String(n)}>{n} {n === 1 ? 'linha de 3 cards' : 'linhas'} ({n * 3} notícias)</option>
                          ))}
                        </AdminSelect>
                      </div>
                      <div className={row}>
                        <span className={label}>Carrossel</span>
                        <AdminSelect aria-label="Carrossel" value={extra.carousel ? 'on' : 'off'} onChange={(e) => setExtra({ carousel: e.target.value === 'on' })} className={fieldHalf}>
                          <option value="off">Desligado (cards em grelha)</option>
                          <option value="on">Ligado (cards a deslizar)</option>
                        </AdminSelect>
                      </div>
                    </>
                  )}
                  {extra.layout === 'lista' && (
                    <>
                      <div className={row}>
                        <span className={label}>Vista da lista</span>
                        <AdminSelect aria-label="Vista da lista" value={extra.listCarousel ? 'carrossel' : 'todas'} onChange={(e) => setExtra({ listCarousel: e.target.value === 'carrossel' })} className={fieldHalf}>
                          <option value="todas">Todas as notícias visíveis</option>
                          <option value="carrossel">Carrossel vertical (sem fim)</option>
                        </AdminSelect>
                      </div>
                      {extra.listCarousel && (
                        <div className={row}>
                          <span className={label}>Notícias à vista</span>
                          <AdminSelect aria-label="Quantas notícias ficam à vista" value={String(extra.visible)} onChange={(e) => setExtra({ visible: Number(e.target.value) })} className={fieldHalf}>
                            {[1, 2, 3, 4, 5, 6].map((n) => (
                              <option key={n} value={String(n)}>{n} {n === 1 ? 'notícia' : 'notícias'}</option>
                            ))}
                          </AdminSelect>
                        </div>
                      )}
                    </>
                  )}
                  <div className={row}>
                    <span className={label}>{key === 'leitura' ? 'Depois do parágrafo' : 'Depois de'}</span>
                    <AdminSelect aria-label="Posição da secção" value={String(extra.after)} onChange={(e) => setExtra({ after: Number(e.target.value) })} className={fieldHalf}>
                      {key === 'leitura'
                        ? [0, 1, 2, 3, 4, 5, 6, 8, 10].map((n) => <option key={n} value={String(n)}>{n === 0 ? 'No fim do texto' : `Parágrafo ${n}`}</option>)
                        : [0, 3, 6, 9, 12, 15, 18].map((n) => <option key={n} value={String(n)}>{n === 0 ? 'No início (antes dos cards)' : `${n} notícias`}</option>)}
                    </AdminSelect>
                  </div>
                  <p className={hint}>
                    {key === 'leitura'
                      ? 'Se o texto tiver menos parágrafos, a secção fica no fim do texto. A notícia que está a ser lida não aparece nela.'
                      : 'Se a página tiver menos notícias, a secção fica no fim. Nas pesquisas não aparece.'}
                  </p>
                </div>
              )}
              </Slide>
            </section>
          )}
        </div>
      )}
      {changed && <p className="mt-4 text-[13px] text-gray-500">Há alterações por guardar.</p>}
    </div>
  );
}
