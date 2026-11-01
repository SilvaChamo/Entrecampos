'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { CardTitle, ListItem, Meta, Tag, Thumb } from '@/components/Expnews/blocks';
import type { Post } from '@/lib/news-data';

/** Dados mínimos de cada notícia (o conteúdo completo não vai para o browser). */
export type SlimPost = Pick<Post, 'slug' | 'title' | 'excerpt' | 'category' | 'categorySlug' | 'image' | 'date'>;
export type CommunityGroup = { slug: string; label: string; posts: SlimPost[] };

/**
 * Primeira secção da home: 1 notícia grande + 5 pequenas, com um selector de categorias
 * no canto superior direito que troca o conteúdo e o título da secção.
 */
export default function CommunitySection({ groups, initial }: { groups: CommunityGroup[]; initial: string }) {
  const [selected, setSelected] = useState(initial);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const group = groups.find((g) => g.slug === selected) ?? groups[0];
  if (!group || group.posts.length === 0) return null;
  const [main, ...rest] = group.posts as Post[];

  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <CardTitle>{group.label}</CardTitle>
        </div>

        {/* Selector de categorias */}
        <div ref={box} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex items-center gap-2 border border-gray-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#d6101c] hover:border-[#d6101c]"
          >
            {group.slug === 'todas' ? 'Todas' : group.label}
            <ChevronDown className={`h-3.5 w-3.5 text-gray-600 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <ul role="listbox" className="absolute right-0 top-full z-30 mt-1 max-h-[320px] w-max min-w-[120px] overflow-y-auto border border-gray-200 bg-white py-1 shadow-xl">
              {groups.map((g) => (
                <li key={g.slug} role="option" aria-selected={g.slug === group.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(g.slug);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] hover:bg-gray-100 hover:text-[#d6101c] ${
                      g.slug === group.slug ? 'font-bold text-[#d6101c]' : 'text-gray-700'
                    }`}
                  >
                    {g.label}
                    {g.slug === group.slug && <Check className="h-3.5 w-3.5" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.05fr_1fr]">
        <article className="bg-white p-4 shadow-sm">
          <Link href={`/noticias/${main.slug}`} className="relative block h-[240px] overflow-hidden bg-gray-200">
            <Thumb src={main.image} />
          </Link>
          <div className="pt-4">
            <Tag label={main.category} slug={main.categorySlug} />
            <Link href={`/noticias/${main.slug}`}>
              <h4 className="mt-2 text-[16px] font-bold leading-snug hover:text-[#d6101c]">{main.title}</h4>
            </Link>
            <div className="mt-2">
              <Meta post={main} />
            </div>
            {main.excerpt && <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-gray-500">{main.excerpt}</p>}
          </div>
        </article>
        {/* Mesma altura do card principal, independente do conteúdo */}
        <div className="relative h-[540px] md:h-auto">
          <div className="absolute inset-0 flex flex-col gap-3">
            {rest.map((p) => (
              <div key={p.slug} className="min-h-0 flex-1">
                <ListItem as="div" post={p} bleed />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
