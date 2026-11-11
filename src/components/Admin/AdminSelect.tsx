'use client';

import { Children, Fragment, isValidElement, useEffect, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { Check, ChevronDown } from 'lucide-react';

interface Opt { value: string; label: string; disabled?: boolean }

/** Classes que posicionam o campo (largura, margens, flex…) ficam no contentor; as restantes (altura, borda, letra) no botão. */
const LAYOUT = /^(w-|min-w-|max-w-|flex-|grow|shrink|basis-|m[trblxy]?-|col-|self-|order-|hidden$|block$)/;
const HAS_SIZE = /(^|\s)(?:[a-z0-9\[\]-]+:)*text-(\[|xs|sm|base|lg)/;

function collect(children: ReactNode, out: Opt[] = []): Opt[] {
  Children.forEach(children, (c) => {
    if (!isValidElement(c)) return;
    const el = c as ReactElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>;
    if (el.type === 'option') {
      const label = Children.toArray(el.props.children).join('');
      out.push({ value: String(el.props.value ?? label), label, disabled: el.props.disabled });
    } else if (el.type === 'optgroup' || el.type === Fragment) collect(el.props.children, out);
  });
  return out;
}

/**
 * Substitui o `<select>` do navegador por um selector com popup próprio, igual em todo o painel:
 * cantos rectos, mesma altura dos botões, abre para o lado em que fica todo visível no ecrã.
 * Usa-se como o `<select>`: `value`, `onChange(e)` com `e.target.value`, e `<option>` lá dentro.
 */
export default function AdminSelect({ value, onChange, className = '', disabled, children, id, title, ...rest }: {
  value?: string | number;
  onChange?: (e: { target: { value: string } }) => void;
  className?: string;
  disabled?: boolean;
  children?: ReactNode;
  id?: string;
  title?: string;
  'aria-label'?: string;
}) {
  const [open, setOpen] = useState(false);
  const [own, setOwn] = useState<string | null>(null); // sem `value`, o selector guarda a escolha (como o <select> sem controlo)
  const [alignRight, setAlignRight] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const options = collect(children);
  const chosen = value !== undefined ? String(value) : (own ?? options[0]?.value ?? '');
  const current = options.find((o) => o.value === chosen);

  const tokens = className.split(/\s+/).filter(Boolean);
  const isLayout = (t: string) => LAYOUT.test(t.slice(t.lastIndexOf(':') + 1));
  const wrapClass = tokens.filter(isLayout).join(' ');
  const btnClass = tokens.filter((t) => !isLayout(t)).join(' ');

  useEffect(() => {
    if (!open) return;
    const away = (e: Event) => { if (root.current && !root.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', esc); };
  }, [open]);

  // Abre para a direita; se não couber no ecrã, abre para a esquerda.
  useLayoutEffect(() => {
    if (!open || !root.current || !list.current) return;
    const left = root.current.getBoundingClientRect().left;
    setAlignRight(left + list.current.offsetWidth > document.documentElement.clientWidth - 8);
  }, [open]);

  return (
    <div ref={root} className={`relative inline-block ${wrapClass}`}>
      <button
        type="button"
        id={id}
        title={title}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={rest['aria-label']}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-2 border border-[#ccd0d4] bg-white text-left outline-none focus:border-[#00a651] disabled:opacity-60 ${HAS_SIZE.test(btnClass) ? '' : 'text-[13px]'} ${btnClass}`}
      >
        <span className="truncate">{current?.label ?? ''}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[#1d2327] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul
          ref={list}
          role="listbox"
          className={`absolute top-full z-50 max-h-72 w-max min-w-full max-w-[calc(100vw-24px)] overflow-y-auto border border-t-0 border-[#ccd0d4] bg-white shadow-md ${alignRight ? 'right-0' : 'left-0'}`}
        >
          {options.map((o) => (
            <li key={o.value} role="option" aria-selected={o.value === chosen}>
              <button
                type="button"
                disabled={o.disabled}
                onClick={() => { setOwn(o.value); onChange?.({ target: { value: o.value } }); setOpen(false); }}
                className={`flex h-9 w-full items-center justify-between gap-3 px-3 text-left text-[13px] text-[#1d2327] hover:text-[#00a651] disabled:opacity-50 ${o.value === chosen ? '!text-[#008f45]' : ''}`}
              >
                <span className="whitespace-nowrap">{o.label}</span>
                {o.value === chosen && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
