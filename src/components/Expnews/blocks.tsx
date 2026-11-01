import Link from 'next/link';
import { Clock } from 'lucide-react';
import CategoryBadge from '@/components/Expnews/CategoryBadge';
import ShareLink from '@/components/Expnews/ShareLink';
import type { Post } from '@/lib/news-data';

export function longDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' });
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

export function Meta({ post, share = true, light = false }: { post: Post; share?: boolean; light?: boolean }) {
  return (
    <div className={`flex items-center gap-3 text-[10px] italic ${light ? 'text-white/80' : 'text-[#d6101c]'}`}>
      <span className="flex items-center gap-1">
        <Clock className="h-3 w-3" />
        Publicado a {longDate(post.date)}
      </span>
      {share && <ShareLink path={`/noticias/${post.slug}`} title={post.title} className={light ? 'text-white/80' : 'text-gray-500'} />}
    </div>
  );
}

export function Thumb({ src, className = '' }: { src: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" loading="lazy" className={`absolute inset-0 h-full w-full object-cover ${className}`} />
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
  return (
    <Tag2 className={`flex gap-3 ${card ? 'h-full items-center bg-white p-3 shadow-sm' : 'py-3'}`}>
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

