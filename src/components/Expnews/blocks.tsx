import Link from 'next/link';
import { Clock } from 'lucide-react';
import CategoryBadge from '@/components/Expnews/CategoryBadge';
import ShareLink from '@/components/Expnews/ShareLink';
import type { Post } from '@/lib/news-data';

export function longDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
}

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** "23 mar 2023": para cartões estreitos onde a data por extenso não cabe. */
export function shortDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 text-[13px] font-extrabold uppercase tracking-[0.14em] text-[#222]">
      <span className="h-[18px] w-[5px] bg-[#d6101c]" />
      {children}
      <span className="h-px flex-1 bg-gray-300" />
    </h3>
  );
}

export function Tag({ label, slug, className = '' }: { label: string; slug?: string; className?: string }) {
  return (
    <CategoryBadge label={label} slug={slug} className={`text-[11px] ${className}`} />
  );
}

/**
 * Data + "Partilhar". Cada um numa linha própria quando não cabem lado a lado; se nem a data cabe
 * por extenso, abrevia-se (regras .ec-meta em globals.css, pela largura do próprio cartão).
 */
export function Meta({ post, share = true, light = false, spread = false }: { post: Post; share?: boolean; light?: boolean; spread?: boolean }) {
  return (
    <div className={`ec-meta flex flex-wrap text-[10px] ${spread ? 'items-center justify-between gap-x-3 gap-y-1' : 'items-center gap-x-3 gap-y-1'} ${light ? 'text-white/80' : 'text-[#d6101c]'}`}>
      <span className="flex items-center gap-1 whitespace-nowrap">
        <Clock className="h-3 w-3 shrink-0" />
        <span className="ec-date-long">{longDate(post.date)}</span>
        <span className="ec-date-short">{shortDate(post.date)}</span>
      </span>
      {share && <ShareLink path={`/noticias/${post.slug}`} title={post.title} className={light ? 'text-white/80' : 'text-gray-500'} />}
    </div>
  );
}

export function Thumb({ src, className = '' }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" decoding="async" className={`absolute inset-0 h-full w-full object-cover ${className}`} />
  );
}

/** Card de notícia da secção Agricultura: foto, etiqueta da categoria fora da foto, título e data. */
export function NewsCard({ post }: { post: Post }) {
  const href = `/noticias/${post.slug}`;
  return (
    <article className="ec-reveal flex h-full flex-col bg-white shadow-sm">
      <Link href={href} className="relative block h-[170px] shrink-0 overflow-hidden bg-gray-200">
        {post.image && <Thumb src={post.image} />}
      </Link>
      <div className="flex flex-1 flex-col px-4 pb-4 pt-3">
        <Tag label={post.category} slug={post.categorySlug} className="self-start" />
        <Link href={href}>
          <h4 className="mt-2 line-clamp-3 text-[14px] font-bold leading-snug hover:text-[#d6101c]">{post.title}</h4>
        </Link>
        {/* A linha e a data ficam sempre no fundo do card, qualquer que seja o tamanho do título. */}
        <div className="mt-auto pt-3">
          <div className="-mx-4 border-t border-gray-300 px-4 pt-2.5">
            <Meta post={post} spread />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ListItem({
  post,
  thumb = 'h-[62px] w-[90px]',
  card = false,
  bleed = false,
  as: Tag2 = 'li',
}: {
  post: Post;
  thumb?: string;
  card?: boolean;
  /** Card com a imagem encostada aos bordos (sem padding à volta da imagem). */
  bleed?: boolean;
  as?: 'li' | 'div';
}) {
  const href = `/noticias/${post.slug}`;
  if (bleed) {
    return (
      <Tag2 className="flex h-full overflow-hidden bg-white shadow-sm">
        <Link href={href} className="relative w-[110px] shrink-0 self-stretch overflow-hidden bg-gray-200">
          <Thumb src={post.image} />
        </Link>
        <div className="flex min-w-0 flex-col justify-center p-3">
          <Link href={href} className="line-clamp-2 text-[13px] font-bold leading-snug hover:text-[#d6101c]">
            {post.title}
          </Link>
          <div className="mt-1">
            <Meta post={post} />
          </div>
        </div>
      </Tag2>
    );
  }
  return (
    <Tag2 className={`${card ? 'ec-reveal ' : ''}flex gap-3 ${card ? 'h-full items-center bg-white p-3 shadow-sm' : 'py-3'}`}>
      <Link href={href} className={`relative shrink-0 overflow-hidden bg-gray-200 ${thumb}`}>
        <Thumb src={post.image} />
      </Link>
      <div className="min-w-0">
        <Link href={href} className="line-clamp-2 text-[12px] font-bold leading-snug hover:text-[#d6101c]">
          {post.title}
        </Link>
        <div className="mt-1">
          <Meta post={post} />
        </div>
      </div>
    </Tag2>
  );
}

