'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MessageSquare, Clock } from 'lucide-react';
import type { HomePost } from '@/lib/home-news';

function formatDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HeroSlider({ posts }: { posts: HomePost[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (posts.length < 2) return;
    const timer = setInterval(() => setActive((i) => (i + 1) % posts.length), 6000);
    return () => clearInterval(timer);
  }, [posts.length, active]);

  const post = posts[active];
  if (!post) return null;

  return (
    <div className="relative h-[300px] overflow-hidden bg-black sm:h-[330px]">
      {posts.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.slug}
          src={p.image}
          alt={p.title}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
            i === active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

      <div className="absolute bottom-0 left-0 right-12 p-5 text-white">
        <Link href={`/noticias/${post.slug}`} className="block">
          <h2 className="line-clamp-2 text-[22px] font-bold leading-[1.2] sm:text-[26px]">{post.title}</h2>
          {post.excerpt && <p className="mt-2 line-clamp-1 text-[11px] text-white/80">{post.excerpt}</p>}
        </Link>
        <div className="mt-3 flex items-center gap-3 text-[10px] text-white/70">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {post.category}
          </span>
        </div>
      </div>

      <div className="absolute right-0 top-1/2 flex -translate-y-1/2 flex-col">
        {posts.map((p, i) => (
          <button
            key={p.slug}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`Destaque ${i + 1}`}
            className={`flex h-9 w-9 items-center justify-center text-[12px] font-bold ${
              i === active ? 'bg-[#1a56db] text-white' : 'bg-black/30 text-white/80 hover:bg-black/50'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
