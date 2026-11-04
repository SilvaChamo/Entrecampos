'use client';

import { useEffect, useMemo, useState } from 'react';
import { Database, Eye, Radio, Users } from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

type Stats = {
  online: number;
  today: string;
  daily: { day: string; views: number; visitors: number }[];
  pages: { path: string; views: number }[];
  countries: { country: string; views: number }[];
  devices: { device: string; views: number }[];
  referrers: { referrer: string; views: number }[];
};

const DEVICE_LABEL: Record<string, string> = { desktop: 'Computador', mobile: 'Telemóvel', tablet: 'Tablet' };
const regionNames = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['pt'], { type: 'region' }) : null;
const countryName = (code: string) => {
  if (!code || code === '??') return 'Desconhecido';
  try { return regionNames?.of(code) || code; } catch { return code; }
};

function Table({ title, rows }: { title: string; rows: { label: string; views: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <section className="rounded border border-[#ccd0d4] bg-white p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-xs text-[#50575e]">Sem dados ainda.</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.label} className="text-xs">
              <div className="flex justify-between gap-2"><span className="truncate">{r.label}</span><span className="font-semibold">{r.views}</span></div>
              <div className="mt-1 h-1.5 rounded bg-[#f0f0f1]"><div className="h-1.5 rounded bg-[#00a651]" style={{ width: `${(r.views / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function TrafegoPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/stats?dias=30', { cache: 'no-store' })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Erro ao ler as estatísticas.');
        setStats(json);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao ler as estatísticas.'));
  }, []);

  const windows = useMemo(() => {
    if (!stats) return [];
    const byDay = new Map(stats.daily.map((d) => [d.day, d]));
    const day = (offset: number) => {
      const d = new Date(`${stats.today}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - offset);
      return d.toISOString().slice(0, 10);
    };
    const sum = (from: number, to: number) => {
      let views = 0, visitors = 0;
      for (let i = from; i <= to; i++) { const d = byDay.get(day(i)); if (d) { views += d.views; visitors += d.visitors; } }
      return { views, visitors };
    };
    return [
      { label: 'Hoje', ...sum(0, 0) },
      { label: 'Ontem', ...sum(1, 1) },
      { label: 'Últimos 7 dias', ...sum(0, 6) },
      { label: 'Últimos 30 dias', ...sum(0, 29) },
    ];
  }, [stats]);

  const series = useMemo(() => {
    if (!stats) return [];
    const byDay = new Map(stats.daily.map((d) => [d.day, d]));
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(`${stats.today}T12:00:00Z`);
      d.setUTCDate(d.getUTCDate() - (29 - i));
      const key = d.toISOString().slice(0, 10);
      return { key, label: key.slice(8) + '/' + key.slice(5, 7), views: byDay.get(key)?.views ?? 0 };
    });
  }, [stats]);
  const maxViews = Math.max(1, ...series.map((s) => s.views));

  return (
    <div className="min-h-screen p-6 text-[#2c3338]">
      <h1 className="mb-1 text-2xl font-normal">Estatísticas</h1>
      <p className="mb-4 text-sm text-[#50575e]">Visitas reais ao site, sem cookies nem dados pessoais. Os visitantes contam-se por dia.</p>

      {error === 'missing_sql' && (
        <div className="rounded border border-[#dba617] bg-white p-4 text-sm leading-6">
          <Database className="mb-1 h-5 w-5 text-[#50575e]" />
          Falta criar a tabela das estatísticas. Cole o conteúdo de <code>sql/estatisticas.sql</code> no SQL Editor do Supabase e corra-o uma vez; as visitas começam a contar logo a seguir.
        </div>
      )}
      {error && error !== 'missing_sql' && <div className="rounded border border-[#d63638] bg-white p-3 text-sm text-[#d63638]">{error}</div>}
      {!stats && !error && <div className="flex justify-center py-20"><Spinner /></div>}

      {stats && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded border border-[#ccd0d4] bg-white p-4">
              <Radio className="mb-1 h-4 w-4 text-[#00a651]" />
              <p className="text-2xl">{stats.online}</p>
              <p className="text-xs text-[#50575e]">Online agora (5 min)</p>
            </div>
            {windows.map((w) => (
              <div key={w.label} className="rounded border border-[#ccd0d4] bg-white p-4">
                <p className="text-xs font-semibold">{w.label}</p>
                <p className="mt-1 flex items-center gap-1 text-lg"><Users className="h-4 w-4 text-[#50575e]" /> {w.visitors}</p>
                <p className="flex items-center gap-1 text-sm text-[#50575e]"><Eye className="h-4 w-4" /> {w.views} páginas</p>
              </div>
            ))}
          </div>

          <section className="rounded border border-[#ccd0d4] bg-white p-4">
            <h2 className="mb-3 text-sm font-semibold">Páginas vistas por dia (30 dias)</h2>
            <div className="flex h-40 items-end gap-1">
              {series.map((s) => (
                <div key={s.key} className="flex flex-1 flex-col items-center justify-end" title={`${s.label}: ${s.views}`}>
                  <div className="w-full rounded-t bg-[#00a651]" style={{ height: `${(s.views / maxViews) * 100}%`, minHeight: s.views ? 2 : 0 }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[10px] text-[#50575e]"><span>{series[0]?.label}</span><span>{series[series.length - 1]?.label}</span></div>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            <Table title="Páginas mais vistas" rows={stats.pages.map((p) => ({ label: p.path, views: p.views }))} />
            <Table title="Países" rows={stats.countries.map((c) => ({ label: countryName(c.country), views: c.views }))} />
            <Table title="Dispositivos" rows={stats.devices.map((d) => ({ label: DEVICE_LABEL[d.device] ?? d.device, views: d.views }))} />
            <Table title="Origem do tráfego" rows={stats.referrers.map((r) => ({ label: r.referrer, views: r.views }))} />
          </div>
        </div>
      )}
    </div>
  );
}
