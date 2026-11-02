import CategoryBadge from '@/components/Expnews/CategoryBadge';
import Link from 'next/link';
import { CalendarCheck, Facebook } from 'lucide-react';
import { getAllPosts, longDatePt } from '@/lib/news-data';

export const FACEBOOK_URL = 'https://www.facebook.com/entrecampos.co.mz/';
const AD_IMAGE = 'https://entrecamposblog.com/wp-content/uploads/2023/08/FRETINEGOCIOS-scaled-1.jpg';

/** Fundo cinzento e coluna central, como no site online. */
export function SiteMain({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-[#c9c9c9] py-8">
      <div className="mx-auto max-w-[1180px] px-4">{children}</div>
    </main>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 border-l-[3px] border-red-600 pl-3 text-[15px] font-bold uppercase text-gray-700">
      {children}
    </h3>
  );
}

/** Etiqueta de categoria clicável (não usar dentro de outra ligação). */
export function CategoryTag({ label, slug, className = '' }: { label: string; slug?: string; className?: string }) {
  return <CategoryBadge label={label} slug={slug} className={`text-[13px] ${className}`} />;
}

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (n: number) => string }) {
  if (pages <= 1) return null;
  const numbers = Array.from({ length: pages }, (_, i) => i + 1);
  const base = 'flex h-9 min-w-9 items-center justify-center border px-3 text-sm';
  return (
    <nav aria-label="Paginação" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link href={hrefFor(page - 1)} className={`${base} border-gray-300 bg-white hover:bg-[#008000] hover:text-white`}>
          ‹ Anterior
        </Link>
      )}
      {numbers.map((n) => (
        <Link
          key={n}
          href={hrefFor(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`${base} ${n === page ? 'border-[#008000] bg-[#008000] text-white' : 'border-gray-300 bg-white hover:bg-[#008000] hover:text-white'}`}
        >
          {n}
        </Link>
      ))}
      {page < pages && (
        <Link href={hrefFor(page + 1)} className={`${base} border-gray-300 bg-white hover:bg-[#008000] hover:text-white`}>
          Seguinte ›
        </Link>
      )}
    </nav>
  );
}

/** Barra lateral do site: Receitas, Facebook, Publicidade. */
export async function SiteSidebar({ facebook = true }: { facebook?: boolean } = {}) {
  const { posts } = await getAllPosts();
  const recipe = posts.find((p) => p.categorySlug === 'receitas' && p.image) ?? posts.find((p) => p.image);

  return (
    <aside className="ec-reveal space-y-6 bg-white p-5">
      {recipe && (
        <section>
          <SectionHeading>{recipe.categorySlug === 'receitas' ? 'Receitas' : 'Em destaque'}</SectionHeading>
          <div className="group relative mt-5 h-[250px] overflow-hidden bg-gray-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.image}
              alt={recipe.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
            <Link href={`/noticias/${recipe.slug}`} aria-label={recipe.title} className="absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-5 text-white">
              <div className="pointer-events-auto w-fit">
                <CategoryTag label={recipe.category} slug={recipe.categorySlug} />
              </div>
              <h4 className="mt-3 line-clamp-3 text-[20px] font-bold leading-tight">{recipe.title}</h4>
              <span className="mt-3 flex items-center gap-2 text-[13px] font-bold text-green-400">
                <CalendarCheck className="h-4 w-4" />
                {longDatePt(recipe.date)}
              </span>
            </div>
          </div>
        </section>
      )}

      {facebook && (
      <section>
        <SectionHeading>Facebook</SectionHeading>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex items-center gap-3 border border-gray-200 p-3 hover:bg-gray-50"
        >
          <span className="flex h-11 w-11 items-center justify-center bg-[#1877F2] text-white">
            <Facebook className="h-6 w-6" />
          </span>
          <span>
            <span className="block text-[17px] text-[#385898]">EntreCampos</span>
            <span className="block text-[12px] text-gray-500">Seguir página</span>
          </span>
        </a>
      </section>
      )}

      <section>
        <SectionHeading>Publicidade</SectionHeading>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={AD_IMAGE} alt="Publicidade" loading="lazy" className="mt-5 w-full" />
      </section>
    </aside>
  );
}
