import Link from 'next/link';
import { Facebook, Instagram, Linkedin, Twitter } from 'lucide-react';
import type { Columnist } from '@/lib/columnists';

export type ColumnistItem = { columnist: Columnist; post: { slug: string; title: string } };

const SOCIALS = [
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'x', label: 'X', Icon: Twitter },
] as const;

function Socials({ c, className = '' }: { c: Columnist; className?: string }) {
  const list = SOCIALS.filter((s) => c[s.key]);
  if (list.length === 0) return null;
  return (
    <div className={`items-center gap-1.5 ${className}`}>
      {list.map(({ key, label, Icon }) => (
        <a
          key={key}
          href={c[key]}
          target="_blank"
          rel="noopener noreferrer nofollow"
          aria-label={`${label} de ${c.nome}`}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white text-[#222] transition-colors hover:border-[#d6101c] hover:bg-[#d6101c] hover:text-white"
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  );
}

/**
 * Colunistas da home: duas colunas de cards (uma só no telemóvel), no desenho do cartão de citação de referência:
 * o cartão branco tem por cima a foto redonda (com o anel bege) a sobrepor o cartão escuro do nome e do @; as redes
 * sociais ficam logo a seguir ao cartão do nome; por baixo vêm o título do artigo e o botão "Ler artigo".
 * No telemóvel as redes sociais passam para junto do botão, porque ao lado do nome não cabem.
 */
export default function Columnists({ items }: { items: ColumnistItem[] }) {
  return (
    <div className="grid gap-x-3 gap-y-6 md:grid-cols-2">
      {items.map(({ columnist: c, post }) => (
        <article key={c.id} className="ec-reveal min-w-0 pt-11 sm:pt-[52px]">
          <div className="relative rounded-2xl bg-white px-5 pb-5 pt-12 shadow-sm sm:pl-16 sm:pt-14">
            {/* Cartão do nome: nasce por baixo da foto (padding à esquerda para o texto não ficar tapado) e passa a linha de cima do cartão. */}
            <div className="absolute -top-[26px] left-[60px] right-3 z-10 flex items-center gap-3 sm:-top-[30px] sm:left-[98px]">
              <div className="flex h-11 min-w-0 flex-col justify-center rounded-md bg-[#231f20] pl-[52px] pr-4 sm:h-[51px] sm:pl-[52px] sm:pr-5">
                <div className="truncate text-[16px] leading-tight text-white sm:text-[18px]">{c.nome}</div>
                {c.handle && <div className="truncate text-[11px] leading-tight text-gray-400">@{c.handle}</div>}
              </div>
              <Socials c={c} className="hidden sm:flex" />
            </div>
            {/* Foto: dentro do cartão, afastada da esquerda, sobre o cartão do nome. */}
            {c.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.foto} alt={c.nome} loading="lazy" decoding="async" className="absolute -top-11 left-3 z-20 h-20 w-20 rounded-full border-2 border-[#231f20] object-cover ring-4 ring-[#d9cdbb] sm:-top-[52px] sm:left-10 sm:h-24 sm:w-24" />
            ) : (
              <span aria-hidden className="absolute -top-11 left-3 z-20 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#231f20] bg-[#e7e0d4] text-[26px] text-[#231f20] ring-4 ring-[#d9cdbb] sm:-top-[52px] sm:left-10 sm:h-24 sm:w-24">
                {c.nome.charAt(0).toUpperCase()}
              </span>
            )}
            <Link href={`/noticias/${post.slug}`} className="block">
              <h4 className="line-clamp-3 text-[18px] leading-tight text-[#222] hover:text-[#d6101c]">{post.title}</h4>
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <Link href={`/noticias/${post.slug}`} className="inline-flex h-9 items-center rounded-md bg-[#d6101c] px-5 text-[13px] text-white hover:bg-[#b50d17]">
                Ler artigo
              </Link>
              <Socials c={c} className="flex sm:hidden" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
