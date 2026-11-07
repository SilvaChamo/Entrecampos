'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, ChevronDown, ChevronUp, Sun, Thermometer, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/** Código WMO (Open-Meteo) → texto em português e ícone. */
function describe(code: number): { text: string; Icon: LucideIcon } {
  if (code === 0) return { text: 'Céu Limpo', Icon: Sun };
  if (code === 1) return { text: 'Ensolarado', Icon: Sun };
  if (code === 2) return { text: 'Parcialmente Nublado', Icon: CloudSun };
  if (code === 3) return { text: 'Nublado', Icon: Cloud };
  if (code === 45 || code === 48) return { text: 'Nevoeiro', Icon: CloudFog };
  if (code >= 51 && code <= 57) return { text: 'Chuva Leve', Icon: CloudDrizzle };
  if (code === 61 || code === 80) return { text: 'Chuva Leve', Icon: CloudDrizzle };
  if ((code >= 63 && code <= 67) || code === 81 || code === 82) return { text: 'Chuva', Icon: CloudRain };
  if (code >= 71 && code <= 77) return { text: 'Neve', Icon: CloudSnow };
  if (code >= 85 && code <= 86) return { text: 'Neve', Icon: CloudSnow };
  if (code >= 95) return { text: 'Trovoada', Icon: CloudLightning };
  return { text: 'Nublado', Icon: Cloud };
}

interface Place {
  name: string;
  current: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[] };
}

/**
 * Clima real das províncias de Moçambique: temperatura actual e previsão de hoje + 4 dias seguintes. Começa pela província do
 * visitante (Maputo se não se souber); as setas passam à província a norte (seta para cima) ou a sul (seta para baixo), em roda.
 */
export default function WeatherCard() {
  // O clima vem do navegador (rota /api/clima, em cache de 30 min): assim a página da notícia pode ficar 7 dias em cache.
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState<'up' | 'down' | null>(null);
  useEffect(() => {
    fetch('/api/clima')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { places?: Place[]; start?: string } | null) => {
        const list = (data?.places ?? []).filter((p) => p.current && p.daily?.time?.length);
        if (list.length === 0) return setFailed(true);
        setPlaces(list);
        setIdx(Math.max(0, list.findIndex((p) => p.name === data?.start)));
      })
      .catch(() => setFailed(true));
  }, []);
  // Sem clima (falha de rede): o card não aparece. Enquanto carrega, o card já ocupa o seu lugar (sem saltos nem entrada).
  if (failed) return null;

  const f = places ? places[idx] : null;
  const move = (d: 1 | -1) => {
    if (!places) return;
    setDir(d === 1 ? 'up' : 'down');
    setIdx((i) => (i + d + places.length) % places.length);
  };

  const days: { label: string; temp: string; text: string; Icon: LucideIcon }[] = f
    ? f.daily.time.slice(0, 5).map((iso, i) => {
        // `iso` é a data local de Maputo (AAAA-MM-DD); o dia da semana calcula-se sem fuso.
        const weekday = WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];
        return { label: i === 0 ? 'Hoje' : weekday, temp: `${Math.round(f.daily.temperature_2m_max[i])}°C`, ...describe(f.daily.weather_code[i]) };
      })
    : Array.from({ length: 5 }, () => ({ label: '', temp: '', text: '', Icon: Cloud }));

  return (
    <section
      aria-label="Clima local"
      className="relative overflow-hidden bg-[#0e1a26] p-5 text-white shadow-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/clima-bg.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1a2b]/55 via-[#0b1a2b]/70 to-[#0b1a2b]/85" />
      {/* Moldura fina, um pouco mais clara que as linhas que separam os dias, a toda a volta de tudo o que está no card */}
      <div className="relative border border-white/25 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/30 bg-white/10">
            <Thermometer className="h-5 w-5" />
          </span>
          <div>
            <h3 className="whitespace-nowrap text-[14px] font-extrabold uppercase leading-tight tracking-wide">Clima local</h3>
            <p className="mt-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.1em] text-slate-300/80">Previsão 5 dias</p>
          </div>
        </div>
        <p key={`t-${idx}`} className={`text-[42px] font-extrabold leading-none ${dir ? `ec-wx-${dir}` : ''}`}>{f ? `${Math.round(f.current.temperature_2m)}°` : '--°'}</p>
      </div>

      {/* Linha por cima da província: nome à esquerda e, à direita, as setas (cima = província a norte, baixo = a sul), na cor do nome */}
      <div className="-mx-3 mt-3 flex items-center justify-between border-t border-white/10 bg-black/30 px-3 py-2 text-emerald-400">
        <p key={`n-${idx}`} className={`whitespace-nowrap text-[14px] font-bold uppercase tracking-[0.1em] ${dir ? `ec-wx-${dir}` : ''}`}>{f?.name ?? '\u00a0'}</p>
        <span className="flex items-center gap-1">
          <button type="button" onClick={() => move(1)} aria-label="Província a norte" className="flex h-6 w-6 items-center justify-center hover:text-white">
            <ChevronUp className="h-5 w-5" />
          </button>
          <button type="button" onClick={() => move(-1)} aria-label="Província a sul" className="flex h-6 w-6 items-center justify-center hover:text-white">
            <ChevronDown className="h-5 w-5" />
          </button>
        </span>
      </div>

      <ul key={`d-${idx}`} className={`mt-3 divide-y divide-white/10 border-b border-white/10 ${dir ? `ec-wx-${dir}` : ''}`}>
        {days.map((d, n) => (
          <li key={n} className="flex items-center gap-3 py-[10px] text-[13px]">
            <span className="w-9 shrink-0 font-bold text-slate-200">{d.label}</span>
            <d.Icon className={`h-5 w-5 shrink-0 text-sky-200 ${f ? '' : 'invisible'}`} />
            <span className="min-w-0 flex-1 truncate text-slate-100">{d.text}</span>
            <span className="shrink-0 font-extrabold">{d.temp}</span>
          </li>
        ))}
      </ul>

      <div key={`h-${idx}`} className={`mt-4 flex items-center justify-between text-[11px] font-medium text-slate-200 ${dir ? `ec-wx-${dir}` : ''}`}>
        <span className="flex items-center gap-2">
          <Wind className="h-4 w-4" />
          {f ? `${Math.round(f.current.wind_speed_10m)}km/h` : '--'}
        </span>
        <span className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          {f ? `${Math.round(f.current.relative_humidity_2m)}% Hum.` : '--'}
        </span>
      </div>
      </div>
    </section>
  );
}
