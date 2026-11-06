import { NextResponse } from 'next/server';

const URL = 'https://open.er-api.com/v6/latest/USD';
const CURRENCIES = ['USD', 'EUR', 'CNY', 'ZAR', 'GBP'];

/** Câmbio em meticais (MZN) das moedas mais usadas em Moçambique: partilhado por todos os visitantes e renovado de hora a hora. */
export async function GET() {
  try {
    const res = await fetch(URL, { next: { revalidate: 3600 }, signal: AbortSignal.timeout(5000) });
    if (!res.ok) return NextResponse.json(null, { status: 502 });
    const data = await res.json();
    const mzn = data?.rates?.MZN;
    if (data?.result !== 'success' || !mzn) return NextResponse.json(null, { status: 502 });
    // As taxas vêm em dólares: quantos meticais vale uma unidade de cada moeda.
    const rates: Record<string, number> = {};
    for (const code of CURRENCIES) {
      const r = data.rates[code];
      if (r) rates[code] = mzn / r;
    }
    return NextResponse.json({ updated: data.time_last_update_utc ?? null, rates }, { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' } });
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}
