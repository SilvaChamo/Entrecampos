'use client';

import { useEffect, useState } from 'react';

/** Data actual e temperatura de Maputo (Open-Meteo, sem chave). */
export default function TopInfo() {
  const [date, setDate] = useState('');
  const [temp, setTemp] = useState<number | null>(null);

  useEffect(() => {
    const text = new Intl.DateTimeFormat('pt-PT', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    setDate(text.charAt(0).toUpperCase() + text.slice(1));

    fetch('https://api.open-meteo.com/v1/forecast?latitude=-25.97&longitude=32.57&current=temperature_2m')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const t = d?.current?.temperature_2m;
        if (typeof t === 'number') setTemp(Math.round(t));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex items-center gap-4 text-[11px] text-gray-600">
      <span className="min-w-[150px]">{date}</span>
      <span>{temp !== null ? `${temp}°C ` : ''}Maputo</span>
    </div>
  );
}
