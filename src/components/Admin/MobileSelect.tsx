'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

export interface MobileSelectOption { value: string; label: string }

/**
 * Selector do painel com popup próprio (cantos rectos, abre para a esquerda, alinhado ao lado direito do campo, e fica todo visível no ecrã),
 * em vez do popup do sistema, que não se pode ajustar. Mesma altura dos botões (h-9) e letra de 13px.
 */
export default function MobileSelect({ value, options, onChange, className = '', ariaLabel }: { value: string; options: MobileSelectOption[]; onChange: (value: string) => void; className?: string; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <div ref={root} className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-full items-center justify-between gap-2 border border-[#ccd0d4] bg-white px-3 text-left text-[13px] text-[#1d2327] focus:border-[#00a651] focus:outline-none"
      >
        <span className="truncate">{current?.label ?? ''}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#646970] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 top-full z-50 w-max min-w-full max-w-[calc(100vw-24px)] border border-t-0 border-[#ccd0d4] bg-white shadow-md">
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === value}>
              <button
                type="button"
                onClick={() => { onChange(o.value); setOpen(false); }}
                className={`flex h-9 w-full items-center justify-between gap-3 px-3 text-left text-[13px] hover:text-[#00a651] ${o.value === value ? 'text-[#008f45]' : 'text-[#1d2327]'}`}
              >
                <span className="whitespace-nowrap">{o.label}</span>
                {o.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
