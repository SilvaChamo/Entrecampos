'use client';

import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronDown, Clock, Mail, Thermometer } from 'lucide-react';

const EMAIL = 'geral@ecamposmz.com';
const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast?latitude=-25.97&longitude=32.57&current=temperature_2m&timezone=Africa%2FMaputo';
const item = 'flex items-center gap-2 text-[11px] font-normal tracking-wide text-gray-300';

const LANGS = [
  { code: 'PT', label: 'Português', flag: 'pt' },
  { code: 'IN', label: 'Inglês', flag: 'gb' },
] as const;

/** Bandeiras em SVG (os emojis de bandeira não aparecem no Windows). */
function Flag({ flag }: { flag: 'pt' | 'gb' }) {
  return (
    <svg viewBox="0 0 18 12" className="block h-3 w-[18px] shrink-0 rounded-[1px]" aria-hidden="true">
      {flag === 'pt' ? (
        <>
          <rect width="18" height="12" fill="#d6101c" />
          <rect width="7" height="12" fill="#006600" />
          <circle cx="7" cy="6" r="2.4" fill="#ffd400" />
        </>
      ) : (
        <>
          <rect width="18" height="12" fill="#012169" />
          <path d="M0 0l18 12M18 0L0 12" stroke="#fff" strokeWidth="2.4" />
          <path d="M0 0l18 12M18 0L0 12" stroke="#c8102e" strokeWidth="1" />
          <path d="M9 0v12M0 6h18" stroke="#fff" strokeWidth="4" />
          <path d="M9 0v12M0 6h18" stroke="#c8102e" strokeWidth="2.2" />
        </>
      )}
    </svg>
  );
}

/** Idioma: bandeira + sigla (PT / IN). A escolha fica guardada neste browser. */
function LanguageMenu() {
  const [code, setCode] = useState<(typeof LANGS)[number]['code']>('PT');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ec-lang');
    if (saved === 'PT' || saved === 'IN') setCode(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = LANGS.find((l) => l.code === code) ?? LANGS[0];
  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Idioma: ${current.label}`}
        className={`${item} hover:text-white`}
      >
        <Flag flag={current.flag} />
        <span className="leading-none">{current.code}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {/* Sempre no DOM: desliza para baixo ao abrir (e para cima ao fechar), sem piscar. */}
      <div className={`absolute right-0 top-full z-[60] overflow-hidden ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <ul
          role="listbox"
          className={`mt-1 space-y-2 border border-[#39ff14]/40 bg-[#0c1f08] p-2.5 shadow-xl transition-[transform,opacity] duration-200 ease-out ${
            open ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
          }`}
        >
          {LANGS.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === code}>
              <button
                type="button"
                tabIndex={open ? 0 : -1}
                onClick={() => {
                  setCode(l.code);
                  localStorage.setItem('ec-lang', l.code);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 whitespace-nowrap text-left text-[11px] font-normal ${l.code === code ? 'text-[#39ff14]' : 'text-gray-300 hover:bg-white/5 hover:text-white'}`}
              >
                <Flag flag={l.flag} />
                <span className="leading-none">{l.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** "Domingo, 2 de novembro de 2026" */
function today() {
  const text = new Date().toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Hora de Maputo, ex.: "14:35:07" */
function now() {
  return new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Africa/Maputo' });
}

/**
 * Barra escura do topo: email da empresa, data com dia da semana e, à direita, a temperatura atual de Maputo | hora.
 */
export default function GreenBar() {
  const [date, setDate] = useState('');
  const [temp, setTemp] = useState<number | null>(null);
  const [time, setTime] = useState('');

  // A data calcula-se no browser: a página pode estar guardada em cache de há uns minutos.
  useEffect(() => setDate(today()), []);

  // Relógio: actualiza-se a cada segundo (horas, minutos e segundos).
  useEffect(() => {
    setTime(now());
    const id = setInterval(() => setTime(now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let alive = true;
    fetch(WEATHER_URL)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && typeof d?.current?.temperature_2m === 'number' && setTemp(Math.round(d.current.temperature_2m)))
      .catch(() => {}); // sem rede ou sem resposta: simplesmente não aparece
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="relative h-9 bg-[#0c1f08] transition-[padding] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:pl-16 lg:group-data-[open=true]/frame:pl-[220px]">
      {/* Linha verde fluorescente (2px, sem blur) por baixo da barra: começa onde a barra de menu acaba, para a linha vertical dela (ExpFrame) fechar o contorno. */}
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-0.5 bg-[#39ff14] transition-[left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] lg:left-[62px] lg:group-data-[open=true]/frame:left-[218px]"
      />
      <div className="mx-3 h-full">
        <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            <a href={`mailto:${EMAIL}`} className={`${item} hover:text-white`}>
              <Mail className="h-3.5 w-3.5 text-[#39ff14]" />
              {EMAIL}
            </a>
            <span className="h-3.5 w-px bg-white/20" />
            <span className={`${item} min-w-0 truncate`} suppressHydrationWarning>
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#39ff14]" />
              {date}
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {temp !== null && (
              <>
                <span className={item}>
                  <Thermometer className="h-3.5 w-3.5 text-[#39ff14]" />
                  Maputo {temp}°C
                </span>
                <span className="text-[11px] text-white/30" aria-hidden="true">|</span>
              </>
            )}
            <span className={`${item} tabular-nums`} suppressHydrationWarning>
              <Clock className="h-3.5 w-3.5 text-[#39ff14]" />
              {time}
            </span>
            <span className="text-[11px] text-white/30" aria-hidden="true">|</span>
            <LanguageMenu />
          </div>
        </div>
      </div>
    </div>
  );
}
