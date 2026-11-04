import { NextResponse } from 'next/server';

const URL =
  'https://api.open-meteo.com/v1/forecast?latitude=-25.97&longitude=32.57' +
  '&current=temperature_2m,relative_humidity_2m,wind_speed_10m' +
  '&daily=weather_code,temperature_2m_max&timezone=Africa%2FMaputo&forecast_days=5';

/** Clima de Maputo (Open-Meteo), partilhado por todos os visitantes e renovado de 30 em 30 minutos. */
export async function GET() {
  try {
    const res = await fetch(URL, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json(null, { status: 502 });
    return NextResponse.json(await res.json(), { headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' } });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
