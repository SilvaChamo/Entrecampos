'use client';

import { useEffect, useState } from 'react';
import { BarChart3, FileText, Mail, Users } from 'lucide-react';

type Send = {
  at: string;
  news: number;
  recipients: number;
  reached: number;
  failed: number;
  tracked: boolean;
  readers: number;
  reads: number;
  top: { slug: string; title: string; readers: number; clicks: number }[];
};

const card = 'rounded-lg border border-[#ccd0d4] bg-white p-6 max-md:p-4';
const th = 'px-4 py-3 text-left font-normal text-[#50575e]';
const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1).replace('.', ',')}%` : '—');
const day = (iso: string) => {
  const w = new Date(iso).toLocaleDateString('pt-PT', { weekday: 'long', timeZone: 'Africa/Maputo' });
  return `${w.charAt(0).toUpperCase()}${w.slice(1)}, ${new Date(iso).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Maputo' })}`;
};
const short = (iso: string) => new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', timeZone: 'Africa/Maputo' });

/** Relatório das newsletters enviadas (no estilo da página de estatísticas): alcançadas, leitores e notícias mais lidas. */
export default function NewsletterReport() {
  const [sends, setSends] = useState<Send[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/newsletter/reports', { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Erro ao carregar o relatório.');
        setSends(d.sends);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Erro ao carregar o relatório.'));
  }, []);

  const list = sends ?? [];
  const counted = list.filter((s) => s.tracked);
  const reached = list.reduce((n, s) => n + s.reached, 0);
  const readers = counted.reduce((n, s) => n + s.readers, 0);
  const reachedCounted = counted.reduce((n, s) => n + s.reached, 0);
  const cards = [
    { label: 'Newsletters enviadas', value: list.length, icon: Mail, color: 'from-[#1fc8a9] to-[#17a589]' },
    { label: 'Pessoas alcançadas', value: reached, icon: Users, color: 'from-[#ff6b6b] to-[#e04848]' },
    { label: 'Leram as notícias', value: readers, icon: FileText, color: 'from-[#4f8ef7] to-[#2f6fe0]' },
    { label: 'Taxa de leitura', value: pct(readers, reachedCounted), icon: BarChart3, color: 'from-[#b05cf0] to-[#8b3fd0]' },
  ];
  const chart = [...list].reverse().slice(-14);
  const max = Math.max(1, ...chart.map((s) => s.reached));

  return (
    <section className="mb-8">
      <h2 className="mb-1 text-lg font-normal text-[#2c3338]">Newsletters enviadas</h2>
      <p className="mb-4 text-[13px] text-[#50575e]">Quantas pessoas cada newsletter alcançou e quantas abriram as notícias que levava. A leitura conta uma vez por pessoa.</p>
      {error && <p className="mb-4 border-l-4 border-[#d63638] bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

      <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-8 md:gap-8 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className={`flex items-center justify-between rounded-lg bg-gradient-to-br ${c.color} p-5 text-white`}>
            <div>
              <div className="text-3xl leading-none">{c.value}</div>
              <div className="mt-2 text-[13px] opacity-90">{c.label}</div>
            </div>
            <c.icon className="h-10 w-10 opacity-40" />
          </div>
        ))}
      </div>

      <div className={`${card} mb-3 md:mb-8`}>
        <h3 className="mb-4 text-base font-normal text-[#2c3338]">Alcance e leituras por newsletter</h3>
        {chart.length === 0 ? (
          <p className="text-sm text-[#50575e]">Ainda não foi enviada nenhuma newsletter.</p>
        ) : (
          <>
            <div className="flex justify-between gap-2 overflow-x-auto px-2">
              {chart.map((s) => (
                <div key={s.at} className="flex min-w-[40px] flex-1 flex-col items-center">
                  <div className="flex h-44 w-full items-end gap-0.5">
                    <div className="flex-1 rounded-t bg-[#5b9bf7]" style={{ height: `${(s.reached / max) * 100}%`, minHeight: s.reached ? 2 : 0 }} title={`Alcançaram: ${s.reached}`} />
                    <div className="flex-1 rounded-t bg-[#f5b324]" style={{ height: `${(s.readers / max) * 100}%`, minHeight: s.readers ? 2 : 0 }} title={`Leram: ${s.readers}`} />
                  </div>
                  <span className="mt-2 whitespace-nowrap text-xs text-gray-500">{short(s.at)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-[#5b9bf7]" /> Alcançaram</span>
              <span className="flex items-center gap-2"><span className="h-4 w-4 rounded bg-[#f5b324]" /> Leram</span>
            </div>
          </>
        )}
      </div>

      <div className={card}>
        <h3 className="mb-4 text-base font-normal text-[#2c3338]">Resumo por envio</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className={th}>Newsletter</th>
                <th className={`${th} text-right`}>Notícias</th>
                <th className={`${th} text-right`}>Alcançaram</th>
                <th className={`${th} text-right`}>Leram</th>
                <th className={`${th} text-right`}>Taxa</th>
                <th className={th}>Mais lidas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sends === null && !error && <tr><td colSpan={6} className="px-4 py-3 text-gray-500">A carregar…</td></tr>}
              {sends?.length === 0 && <tr><td colSpan={6} className="px-4 py-3 text-gray-500">Ainda não foi enviada nenhuma newsletter.</td></tr>}
              {list.map((s) => (
                <tr key={s.at} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-gray-700">{day(s.at)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{s.news}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{s.reached}{s.failed > 0 ? <span className="text-[#d63638]"> (+{s.failed} falhas)</span> : null}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{s.tracked ? s.readers : '—'}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{s.tracked ? pct(s.readers, s.reached) : '—'}</td>
                  <td className="px-4 py-3 text-[12px] text-gray-600">
                    {!s.tracked ? <span className="text-gray-400">Sem contagem (envio anterior)</span> : s.top.length === 0 ? <span className="text-gray-400">Ainda ninguém abriu</span> : (
                      <ul className="space-y-0.5">{s.top.map((t) => <li key={t.slug}><a href={`/noticias/${t.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-[#00a651]">{t.title}</a> <span className="text-gray-400">· {t.readers}</span></li>)}</ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
