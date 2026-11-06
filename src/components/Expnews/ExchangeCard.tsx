'use client';

import { useEffect, useState } from 'react';
import { CardTitle } from '@/components/Expnews/blocks';

const CURRENCIES: { code: string; name: string; symbol: string }[] = [
  { code: 'USD', name: 'Dólar americano', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'CNY', name: 'Yuan chinês', symbol: '¥' },
  { code: 'ZAR', name: 'Rand sul-africano', symbol: 'R' },
  { code: 'GBP', name: 'Libra esterlina', symbol: '£' },
];

/** Câmbio do dia em meticais: dólar, euro, yuan, rand e libra. Vem do navegador (rota /api/cambio, em cache de 1 hora) para a página poder ficar em cache. */
export default function ExchangeCard() {
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    fetch('/api/cambio')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setRates(data?.rates && Object.keys(data.rates).length ? data.rates : null))
      .catch(() => setRates(null));
  }, []);
  if (!rates) return null;

  return (
    <section aria-label="Câmbio" className="ec-reveal overflow-hidden bg-white p-5 shadow-sm">
      <div className="mb-4">
        <CardTitle>Câmbio</CardTitle>
      </div>
      <ul className="divide-y divide-gray-100">
        {CURRENCIES.filter((c) => rates[c.code]).map((c) => (
          <li key={c.code} className="flex items-center gap-3 py-2 text-[13px]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#008000]/10 text-[14px] font-bold text-[#008000]">{c.symbol}</span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-tight">{c.code}</span>
              <span className="block truncate text-[11px] text-gray-500">{c.name}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums">{rates[c.code].toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[10px] text-gray-400">Valor de 1 unidade em meticais, actualizado diariamente.</p>
    </section>
  );
}
