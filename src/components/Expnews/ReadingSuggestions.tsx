'use client';

import { useEffect, useState } from 'react';
import { CardTitle, NewsCard } from '@/components/Expnews/blocks';
import type { SlimPost } from '@/components/Expnews/CategorySection';
import type { Post } from '@/lib/news-data';

const COUNT = 4; // uma só linha de 4

/**
 * Sugestões de leitura no fim da home: notícias à sorte (de várias categorias), numa só linha de 4 colunas, nos cards principais de notícia.
 * A escolha faz-se no navegador, por isso muda a cada visita (a página em si fica em cache).
 */
export default function ReadingSuggestions({ posts }: { posts: SlimPost[] }) {
  const [picked, setPicked] = useState<SlimPost[] | null>(null);

  useEffect(() => {
    const pool = [...posts];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    setPicked(pool.slice(0, COUNT));
  }, [posts]);

  if (posts.length === 0) return null;

  return (
    <section>
      <div className="mb-3">
        <CardTitle>Sugestões de leitura</CardTitle>
      </div>
      {/* Espaço reservado até a escolha estar feita, para a página não saltar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 min-h-[260px]">
        {picked?.map((p) => (
          <NewsCard key={p.slug} post={p as Post} />
        ))}
      </div>
    </section>
  );
}
