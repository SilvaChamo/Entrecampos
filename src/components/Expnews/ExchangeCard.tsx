'use client';

import { useEffect, useState } from 'react';
import { CardTitle } from '@/components/Expnews/blocks';
import CurrencyFlag from '@/components/Expnews/CurrencyFlag';

const CURRENCIES: { code: string; name: string }[] = [
  { code: 'USD', name: 'Dólar americano' },
  { code: 'EUR', name: 'Euro' },
  { code: 'CNY', name: 'Yuan chinês' },
  { code: 'ZAR', name: 'Rand sul-africano' },
  { code: 'GBP', name: 'Libra esterlina' },
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
      <div className="mb-3">
        <CardTitle>Câmbio do dia</CardTitle>
      </div>
      <ul className="-mx-5 divide-y divide-gray-100 border-t border-gray-200 px-5">
        {CURRENCIES.filter((c) => rates[c.code]).map((c) => (
          <li key={c.code} className="flex items-center gap-3 py-2 text-[13px]">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-[#008000]/10">
              <CurrencyFlag code={c.code} className="h-4 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-tight">{c.code}</span>
              <span className="block truncate text-[11px] text-gray-500">{c.name}</span>
            </span>
            <span className="shrink-0 font-bold tabular-nums">{rates[c.code].toLocaleString('pt-PT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT</span>
          </li>
        ))}
      </ul>
      <p className="-mx-5 -mb-5 mt-3 border-t border-[#d6101c]/30 bg-[#008000]/5 px-3 py-4 text-center text-[10px] text-gray-500">Valor de 1 unidade em meticais, actualizado diariamente.</p>
    </section>
  );
}
