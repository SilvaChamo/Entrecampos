import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, Thermometer, Wind } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-25.97&longitude=32.57' +
  '&current=temperature_2m,relative_humidity_2m,wind_speed_10m' +
  '&daily=weather_code,temperature_2m_max&timezone=Africa%2FMaputo&forecast_days=5';

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

interface Forecast {
  current: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[] };
}

async function getForecast(): Promise<Forecast | null> {
  try {
    const res = await fetch(URL, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as Forecast;
    return data?.current && data?.daily?.time?.length ? data : null;
  } catch {
    return null;
  }
}

/** Clima real de Maputo: temperatura actual e previsão de hoje + 4 dias seguintes. */
export default async function WeatherCard() {
  const f = await getForecast();
  if (!f) return null;

  const days = f.daily.time.slice(0, 5).map((iso, i) => {
    // `iso` é a data local de Maputo (AAAA-MM-DD); o dia da semana calcula-se sem fuso.
    const weekday = WEEKDAYS[new Date(`${iso}T12:00:00Z`).getUTCDay()];
    return {
      label: i === 0 ? 'Hoje' : weekday,
      temp: Math.round(f.daily.temperature_2m_max[i]),
      ...describe(f.daily.weather_code[i]),
    };
  });

  return (
    <section
      aria-label="Clima local"
      className="ec-reveal relative overflow-hidden bg-[#0e1a26] p-5 text-white shadow-sm"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/clima-bg.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0b1a2b]/55 via-[#0b1a2b]/70 to-[#0b1a2b]/85" />
      <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 bg-white/10">
            <Thermometer className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[15px] font-extrabold uppercase leading-tight tracking-wide">Clima local</h3>
            <p className="mt-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.1em] text-slate-300/80">Previsão 5 dias</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[34px] font-extrabold leading-none">{Math.round(f.current.temperature_2m)}°</p>
          <p className="mt-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-400">Maputo, MZ</p>
        </div>
      </div>

      <ul className="mt-5 divide-y divide-white/10 border-y border-white/10">
        {days.map((d) => (
          <li key={d.label} className="flex items-center gap-3 py-[10px] text-[13px]">
            <span className="w-9 shrink-0 font-bold text-slate-200">{d.label}</span>
            <d.Icon className="h-5 w-5 shrink-0 text-sky-200" />
            <span className="min-w-0 flex-1 truncate text-slate-100">{d.text}</span>
            <span className="shrink-0 font-extrabold">{d.temp}°C</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between text-[11px] font-medium text-slate-200">
        <span className="flex items-center gap-2">
          <Wind className="h-4 w-4" />
          {Math.round(f.current.wind_speed_10m)}km/h
        </span>
        <span className="flex items-center gap-2">
          <Cloud className="h-4 w-4" />
          {Math.round(f.current.relative_humidity_2m)}% Hum.
        </span>
      </div>
      </div>
    </section>
  );
}
