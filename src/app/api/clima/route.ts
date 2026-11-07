import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

/** Capitais das províncias, de sul para norte (a ordem em que o card as percorre). */
const PLACES = [
  { name: 'Maputo', lat: -25.97, lon: 32.57 },
  { name: 'Gaza', lat: -25.05, lon: 33.64 },
  { name: 'Inhambane', lat: -23.87, lon: 35.38 },
  { name: 'Sofala', lat: -19.84, lon: 34.84 },
  { name: 'Manica', lat: -19.12, lon: 33.48 },
  { name: 'Zambézia', lat: -17.88, lon: 36.89 },
  { name: 'Tete', lat: -16.16, lon: 33.59 },
  { name: 'Nampula', lat: -15.12, lon: 39.27 },
  { name: 'Niassa', lat: -13.31, lon: 35.24 },
  { name: 'Cabo Delgado', lat: -12.97, lon: 40.52 },
];

/** Código de região do visitante (cabeçalho da Vercel, ISO 3166-2:MZ) → província. */
const REGION: Record<string, string> = { MPM: 'Maputo', L: 'Maputo', G: 'Gaza', I: 'Inhambane', S: 'Sofala', B: 'Manica', Q: 'Zambézia', T: 'Tete', N: 'Nampula', A: 'Niassa', P: 'Cabo Delgado' };

const URL =
  'https://api.open-meteo.com/v1/forecast' +
  `?latitude=${PLACES.map((p) => p.lat).join(',')}&longitude=${PLACES.map((p) => p.lon).join(',')}` +
  '&current=temperature_2m,relative_humidity_2m,wind_speed_10m' +
  '&daily=weather_code,temperature_2m_max&timezone=Africa%2FMaputo&forecast_days=5';

/**
 * Clima de todas as províncias (Open-Meteo, um só pedido, renovado de 30 em 30 minutos e partilhado por todos os visitantes)
 * e a província do visitante, para o card começar por ela. Sem localização (ou fora de Moçambique) começa em Maputo.
 */
export async function GET() {
  try {
    const res = await fetch(URL, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) return NextResponse.json(null, { status: 502 });
    const raw = await res.json();
    const list = Array.isArray(raw) ? raw : [raw];
    const places = PLACES.map((p, i) => ({ name: p.name, current: list[i]?.current, daily: list[i]?.daily })).filter((p) => p.current && p.daily);
    const h = await headers();
    const region = h.get('x-vercel-ip-country') === 'MZ' ? (h.get('x-vercel-ip-country-region') || '').toUpperCase() : '';
    return NextResponse.json({ places, start: REGION[region] || 'Maputo' }, { headers: { 'Cache-Control': 'private, max-age=600' } });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
