'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Database, FileText, Globe, Monitor, RefreshCw, Search, Users } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import AdminSelect from '@/components/Admin/AdminSelect';

type Daily = { day: string; views: number; visitors: number };
type Stats = {
  online: number;
  today: string;
  daily: Daily[];
  news: { slug: string; title: string; views: number }[];
  countries: { country: string; views: number }[];
  devices: { device: string; views: number }[];
  referrers: { referrer: string; views: number }[];
};

const DEVICE_LABEL: Record<string, string> = { desktop: 'Computador', mobile: 'Telemóvel', tablet: 'Tablet' };
const SEARCH_ENGINES: { name: string; match: RegExp }[] = [
  { name: 'Google', match: /google\./i },
  { name: 'Bing', match: /bing\./i },
  { name: 'Yahoo', match: /yahoo\./i },
  { name: 'DuckDuckGo', match: /duckduckgo\./i },
];

const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['pt'], { type: 'region' }) : null;
const countryName = (code: string) => {
  if (!code || code === '??') return 'Desconhecido';
  try { return regionNames?.of(code) || code; } catch { return code; }
};
/** Bandeira a partir do código do país (duas letras). */
const flag = (code: string) =>
  /^[A-Za-z]{2}$/.test(code || '') ? String.fromCodePoint(...code.toUpperCase().split('').map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : '🏳️';

const btn = 'flex h-9 items-center gap-2 border border-[#ccd0d4] bg-white px-4 text-[13px] text-[#2c3338] hover:text-[#00a651]';
const card = 'rounded-lg border border-[#ccd0d4] bg-white p-6 max-md:p-4';
const th = 'px-4 py-3 text-left font-normal text-[#50575e]';

function BarList({ title, icon: Icon, rows }: { title: string; icon: typeof Globe; rows: { label: string; views: number; flag?: string; href?: string }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <section className={card}>
      <h2 className="mb-4 flex items-center gap-2 text-lg font-normal text-[#2c3338]"><Icon className="h-5 w-5 text-[#00a651]" /> {title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#50575e]">Sem dados ainda.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label} className="text-sm">
              <div className="flex justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2"><span className="text-lg leading-none">{r.flag}</span>{r.href ? <a href={r.href} target="_blank" rel="noopener noreferrer" className="line-clamp-2 hover:text-[#00a651]">{r.label}</a> : <span className="truncate">{r.label}</span>}</span>
                <span>{r.views}</span>
              </div>
              <div className="mt-1 h-1.5 rounded bg-[#f0f0f1]"><div className="h-1.5 rounded bg-[#00a651]" style={{ width: `${(r.views / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TrafegoPage() {
  const [stats, setStats] = useState<Stats | null>(null); // últimos 30 dias: páginas, países, dispositivos, origens
  const [year, setYear] = useState<Daily[] | null>(null); // dia a dia, até 365 dias
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('14');
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/stats?dias=365', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao ler as estatísticas.');
      setStats(json as Stats);
      setYear((json as Stats).daily);
      setNow(new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString('pt-PT'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao ler as estatísticas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const byDay = useMemo(() => new Map((year ?? stats?.daily ?? []).map((d) => [d.day, d])), [year, stats]);
  const dayKey = useCallback((offset: number) => {
    const d = new Date(`${stats?.today ?? new Date().toISOString().slice(0, 10)}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - offset);
    return d.toISOString().slice(0, 10);
  }, [stats]);

  const sum = useCallback((from: number, to: number) => {
    let views = 0, visitors = 0;
    for (let i = from; i <= to; i++) { const d = byDay.get(dayKey(i)); if (d) { views += d.views; visitors += d.visitors; } }
    return { views, visitors };
  }, [byDay, dayKey]);

  const summary = useMemo(() => {
    if (!stats) return [];
    const yearStart = `${stats.today.slice(0, 4)}-01-01`;
    let yViews = 0, yVisitors = 0, allViews = 0, allVisitors = 0;
    for (const d of year ?? []) {
      allViews += d.views; allVisitors += d.visitors;
      if (d.day >= yearStart) { yViews += d.views; yVisitors += d.visitors; }
    }
    return [
      { label: 'Hoje', ...sum(0, 0) },
      { label: 'Ontem', ...sum(1, 1) },
      { label: 'Últimos 7 dias', ...sum(0, 6) },
      { label: 'Últimos 30 dias', ...sum(0, 29) },
      { label: 'Este ano', views: yViews, visitors: yVisitors },
      { label: 'Últimos 365 dias', views: allViews, visitors: allVisitors, total: true },
    ];
  }, [stats, year, sum]);

  const series = useMemo(() => {
    const n = Number(period);
    return Array.from({ length: n }, (_, i) => {
      const key = dayKey(n - 1 - i);
      const d = byDay.get(key);
      return { key, label: key.slice(8) + '/' + key.slice(5, 7), views: d?.views ?? 0, visitors: d?.visitors ?? 0 };
    });
  }, [period, byDay, dayKey]);
  const maxViews = Math.max(1, ...series.map((s) => s.views));

  const engines = useMemo(() => {
    const list = SEARCH_ENGINES.map((e) => ({
      name: e.name,
      total: (stats?.referrers ?? []).filter((r) => e.match.test(r.referrer)).reduce((s, r) => s + r.views, 0),
    })).filter((e) => e.total > 0);
    return list;
  }, [stats]);
  const enginesTotal = engines.reduce((s, e) => s + e.total, 0);

  const today = summary[0];

  return (
    <div className="ec-page min-h-screen w-full text-[#2c3338]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 md:mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-green-400 to-green-600">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-normal text-gray-700">Estatísticas de visitas em tempo real</h1>
            <p className="text-sm text-gray-500">{now}</p>
          </div>
        </div>
        <button onClick={load} disabled={loading} className={`${btn} disabled:opacity-60`}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Actualizar
        </button>
      </div>
      <p className="mb-3 text-sm text-[#50575e] md:mb-4">Visitas reais ao site, sem cookies nem dados pessoais. Os visitantes contam-se por dia.</p>

      {error === 'missing_sql' && (
        <div className="rounded border border-[#dba617] bg-white p-4 text-sm leading-6">
          <Database className="mb-1 h-5 w-5 text-[#50575e]" />
          Falta criar a tabela das estatísticas. Cole o conteúdo de <code>sql/estatisticas.sql</code> no SQL Editor do Supabase e corra-o uma vez; as visitas começam a contar logo a seguir.
        </div>
      )}
      {error && error !== 'missing_sql' && <div className="rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {!stats && !error && <div className="flex justify-center py-20"><Spinner /></div>}

      {stats && (
        <>
          <div className="mb-8 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
            {[
              { value: stats.online, label: 'Online agora (5 min)', icon: Users, bg: 'from-teal-400 to-teal-600' },
              { value: today?.visitors ?? 0, label: 'Visitantes de hoje', icon: Globe, bg: 'from-red-400 to-red-600' },
              { value: today?.views ?? 0, label: 'Páginas vistas hoje', icon: FileText, bg: 'from-green-400 to-green-600' },
              { value: enginesTotal, label: 'Vindos de motores de busca (30 dias)', icon: Search, bg: 'from-purple-400 to-purple-600' },
            ].map((c) => (
              <div key={c.label} className={`rounded-lg bg-gradient-to-br ${c.bg} p-5 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-4xl">{c.value}</p>
                    <p className="mt-1 flex items-center gap-2 text-sm opacity-90"><c.icon className="h-4 w-4" /> {c.label}</p>
                  </div>
                  <c.icon className="h-12 w-12 opacity-20" />
                </div>
              </div>
            ))}
          </div>

          <div className={`${card} mb-8`}>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-lg font-normal text-gray-700"><BarChart3 className="h-5 w-5 text-[#00a651]" /> Relatório de visitas</h2>
              <AdminSelect
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="h-9 rounded-md border border-gray-300 bg-white px-3 text-[13px] focus:border-green-600 focus:outline-none"
              >
                <option value="7">Últimos 7 dias</option>
                <option value="14">Últimos 14 dias</option>
                <option value="30">Últimos 30 dias</option>
              </AdminSelect>
            </div>

            <div className="flex justify-between gap-2 overflow-x-auto px-2 md:px-4">
              {series.map((d) => (
                <div key={d.key} className="flex min-w-[34px] flex-1 flex-col">
                  <div className="flex h-52 w-full items-end gap-0.5">
                    <div className="flex-1 rounded-t bg-green-400" style={{ height: `${(d.views / maxViews) * 100}%`, minHeight: d.views ? 2 : 0 }} title={`Páginas vistas: ${d.views}`} />
                    <div className="flex-1 rounded-t bg-amber-400" style={{ height: `${(d.visitors / maxViews) * 100}%`, minHeight: d.visitors ? 2 : 0 }} title={`Visitantes: ${d.visitors}`} />
                  </div>
                  {/* Datas por baixo das barras, inclinadas para fora do gráfico, num espaço só delas */}
                  <div className="relative h-14 w-full">
                    <span className="absolute right-1/2 top-2 origin-top-right -rotate-45 whitespace-nowrap text-xs text-gray-500">{d.label}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-green-400" /><span className="text-sm text-gray-600">Páginas vistas</span></div>
              <div className="flex items-center gap-2"><div className="h-4 w-4 rounded bg-amber-400" /><span className="text-sm text-gray-600">Visitantes</span></div>
            </div>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-3 md:gap-8 lg:grid-cols-2">
            <div className={card}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-normal text-gray-700"><BarChart3 className="h-5 w-5 text-[#00a651]" /> Resumo</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={th}>Período</th>
                      <th className={`${th} text-right`}>Visitantes</th>
                      <th className={`${th} text-right`}>Páginas vistas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {summary.map((s) => (
                      <tr key={s.label} className={'total' in s && s.total ? 'bg-green-50' : ''}>
                        <td className={`px-4 py-3 ${'total' in s && s.total ? 'text-green-700' : 'text-gray-700'}`}>{s.label}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.visitors}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{s.views}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={card}>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-normal text-gray-700"><Search className="h-5 w-5 text-[#00a651]" /> Motores de busca (30 dias)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className={th}>Motor</th>
                      <th className={`${th} text-right`}>Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {engines.length === 0 && (
                      <tr><td colSpan={2} className="px-4 py-3 text-gray-500">Sem dados ainda.</td></tr>
                    )}
                    {engines.map((e) => (
                      <tr key={e.name}>
                        <td className="px-4 py-3 text-gray-700">{e.name}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{e.total}</td>
                      </tr>
                    ))}
                    {engines.length > 0 && (
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-gray-700">Total</td>
                        <td className="px-4 py-3 text-right text-gray-700">{enginesTotal}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:gap-8 lg:grid-cols-2">
            <BarList title="Países (30 dias)" icon={Globe} rows={stats.countries.map((c) => ({ label: countryName(c.country), views: c.views, flag: flag(c.country) }))} />
            <BarList title="Notícias mais lidas (30 dias)" icon={FileText} rows={stats.news.map((n) => ({ label: n.title, views: n.views, href: `/noticias/${n.slug}` }))} />
            <BarList
              title="Dispositivos (30 dias)"
              icon={Monitor}
              rows={stats.devices.map((d) => ({ label: DEVICE_LABEL[d.device] ?? d.device, views: d.views }))}
            />
            <BarList title="Origem do tráfego (30 dias)" icon={Search} rows={stats.referrers.map((r) => ({ label: r.referrer, views: r.views }))} />
          </div>
        </>
      )}
    </div>
  );
}
