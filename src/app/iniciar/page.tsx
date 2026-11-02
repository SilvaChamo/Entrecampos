import Link from 'next/link';
import { Montserrat } from 'next/font/google';
import { Facebook, Instagram, Search, Twitter, Youtube } from 'lucide-react';
import HeroSlider from '@/components/Home/HeroSlider';
import TopInfo from '@/components/Home/TopInfo';
import HomesMenu from '@/components/Home/HomesMenu';
import styles from '@/components/Home/home.module.css';
import { getHomePosts, type HomePost } from '@/lib/home-news';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-home',
});

export const metadata = {
  title: 'EntreCAMPOS — Início',
  description: 'Jornal EntreCAMPOS',
};

export const revalidate = 300;

const NAV = [
  { label: 'Início', href: '/iniciar' },
  { label: 'Agricultura', href: '/categoria/agricultura' },
  { label: 'Comunidade', href: '/categoria/comunidade' },
  { label: 'Agro-negócio', href: '/categoria/agro-negocio' },
  { label: 'Curiosidade', href: '/categoria/curiosidade' },
  { label: 'Sector agrário', href: '/categoria/sector-agrario' },
  { label: 'Fruticultura', href: '/categoria/fruticultura' },
  { label: 'Oportunidades', href: '/categoria/oportunidades' },
  { label: 'Ambiente', href: '/categoria/ambiente' },
  { label: 'Arquivo', href: '/noticias' },
];

const CATEGORY_COLORS = ['text-[#e11d48]', 'text-[#16a34a]', 'text-[#1a56db]', 'text-[#d97706]'];

function shortDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Distribui as notícias pelas secções sem repetir (só repete se houver menos notícias do que lugares). */
function takeFrom(posts: HomePost[], cursor: { i: number }, count: number) {
  const out: HomePost[] = [];
  for (let n = 0; n < count; n++) out.push(posts[cursor.i++ % posts.length]);
  return out;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h3 className="text-[15px] font-bold text-[#111]">{children}</h3>
      <span className="h-[2px] w-9 bg-[#2bb673]" />
    </div>
  );
}

function CategoryTag({ label }: { label: string }) {
  return (
    <span className="absolute bottom-0 left-0 bg-black px-2 py-[3px] text-[8px] font-bold uppercase tracking-wide text-white">
      {label}
    </span>
  );
}

function ImageCard({ post, ratio = 'aspect-[1/1.05]' }: { post: HomePost; ratio?: string }) {
  return (
    <Link href={`/noticias/${post.slug}`} className="group block">
      <div className={`relative overflow-hidden bg-gray-200 ${ratio}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image}
          alt={post.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <CategoryTag label={post.category} />
      </div>
      <h4 className="mt-3 line-clamp-2 text-[13px] font-bold leading-snug group-hover:text-[#2bb673]">{post.title}</h4>
    </Link>
  );
}

export default async function HomePage() {
  const { posts } = await getHomePosts();

  if (posts.length === 0) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-500">
        Sem notícias disponíveis de momento.
      </main>
    );
  }

  const cursor = { i: 0 };
  const hero = takeFrom(posts, cursor, 4);
  const heroSide = takeFrom(posts, cursor, 4);
  const ticker = takeFrom(posts, cursor, 4);
  const world = takeFrom(posts, cursor, 4);
  const popular = takeFrom(posts, cursor, 5);
  const editor = takeFrom(posts, cursor, 7);
  const latest = takeFrom(posts, cursor, 3);

  return (
    <div className={`${montserrat.variable} ${styles.root}`}>
      <div className="mx-auto max-w-[1170px] px-4 sm:px-6">
        {/* Topo: data / logótipo / redes */}
        <header className="flex flex-wrap items-center justify-between gap-3 py-5">
          <div className="order-2 w-1/2 sm:order-1 sm:w-auto sm:flex-1">
            <TopInfo />
          </div>
          <Link href="/iniciar" className="order-1 flex w-full justify-center sm:order-2 sm:w-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="EntreCAMPOS" className="h-12 w-auto sm:h-14" />
          </Link>
          <div className="order-3 flex flex-1 items-center justify-end gap-3 text-[11px] text-gray-600">
            <span className="hidden sm:inline">PT(MZ)</span>
            <div className="flex gap-1.5">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="flex h-5 w-5 items-center justify-center bg-black text-white hover:bg-[#2bb673]"
                >
                  <Icon className="h-3 w-3" />
                </Link>
              ))}
            </div>
          </div>
        </header>

        {/* Faixa de últimas */}
        <div className="grid grid-cols-2 gap-x-5 gap-y-3 border-y border-gray-200 py-3 lg:grid-cols-4">
          {ticker.map((p) => (
            <Link key={p.slug} href={`/noticias/${p.slug}`} className="group flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt="" className="h-9 w-12 shrink-0 object-cover" />
              <span className="line-clamp-2 text-[11px] font-semibold leading-tight group-hover:text-[#2bb673]">
                {p.title}
              </span>
            </Link>
          ))}
        </div>

        {/* Destaque + lista lateral */}
        <section className="mt-5 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
          <HeroSlider posts={hero} />
          <div className="flex flex-col justify-between gap-4">
            {heroSide.map((p, i) => (
              <Link key={p.slug} href={`/noticias/${p.slug}`} className="group block border-b border-gray-100 pb-3 last:border-0">
                <span className={`text-[9px] font-bold uppercase ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`}>
                  {p.category}
                </span>
                <h4 className="mt-1 line-clamp-2 text-[12px] font-bold leading-snug group-hover:text-[#2bb673]">
                  {p.title}
                </h4>
              </Link>
            ))}
          </div>
        </section>

        {/* Agricultura */}
        <section className="mt-10">
          <SectionTitle>Agricultura</SectionTitle>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {world.map((p) => (
              <article key={p.slug}>
                <ImageCard post={p} />
                {p.excerpt && <p className="mt-2 line-clamp-2 text-[10px] leading-relaxed text-gray-500">{p.excerpt}</p>}
                <Link href={`/noticias/${p.slug}`} className="mt-2 inline-block text-[10px] font-bold hover:text-[#2bb673]">
                  Ler artigo
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* Mais lidas */}
        <section className="mt-10">
          <SectionTitle>Mais lidas</SectionTitle>
          <div className="grid gap-5 lg:grid-cols-2">
            <Link href={`/noticias/${popular[0].slug}`} className="group block">
              <div className="relative aspect-[1/0.85] overflow-hidden bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={popular[0].image}
                  alt={popular[0].title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <CategoryTag label={popular[0].category} />
              </div>
              <h4 className="mt-4 line-clamp-2 text-[22px] font-bold leading-tight group-hover:text-[#2bb673]">
                {popular[0].title}
              </h4>
              {popular[0].excerpt && (
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-gray-500">{popular[0].excerpt}</p>
              )}
            </Link>
            <div className="grid grid-cols-2 gap-x-4 gap-y-5">
              {popular.slice(1).map((p) => (
                <ImageCard key={p.slug} post={p} ratio="aspect-[1/0.9]" />
              ))}
            </div>
          </div>
        </section>

        {/* Escolha do editor + Últimas */}
        <section className="mt-10">
          <SectionTitle>Escolha do editor</SectionTitle>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {editor.slice(0, 3).map((p) => (
              <ImageCard key={p.slug} post={p} ratio="aspect-[1/0.9]" />
            ))}
            <div className="row-span-2">
              <ImageCard post={editor[3]} ratio="aspect-[1/0.7]" />
              <div className="mt-7">
                <SectionTitle>Últimas</SectionTitle>
                <ul className="space-y-4">
                  {latest.map((p) => (
                    <li key={p.slug}>
                      <Link href={`/noticias/${p.slug}`} className="group block">
                        <h5 className="line-clamp-2 text-[12px] font-bold leading-snug group-hover:text-[#2bb673]">
                          {p.title}
                        </h5>
                        <span className="mt-1 block text-[9px] text-gray-500">{shortDate(p.date)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {editor.slice(4, 7).map((p) => (
              <ImageCard key={p.slug} post={p} ratio="aspect-[1/0.9]" />
            ))}
          </div>
        </section>

        {/* Menu inferior */}
        <nav className="mt-12 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-gray-200 py-4 text-[11px] font-semibold">
          {NAV.map((item) =>
            item.label === 'Início' ? (
              <HomesMenu key={item.label} label={item.label} triggerClassName="hover:text-[#2bb673]" />
            ) : (
              <Link key={item.label} href={item.href} className="hover:text-[#2bb673]">
                {item.label}
              </Link>
            ),
          )}
          <Link href="/noticias" aria-label="Pesquisar" className="hover:text-[#2bb673]">
            <Search className="h-3 w-3" />
          </Link>
        </nav>

        {/* Rodapé */}
        <footer className="border-t border-gray-200 pb-10 pt-10">
          <div className="grid grid-cols-2 gap-8 text-[11px] lg:grid-cols-4">
            <FooterColumn
              title="Notícias"
              links={[
                ['Todas as notícias', '/noticias'],
                ['Agricultura', '/categoria/agricultura'],
                ['Comunidade', '/categoria/comunidade'],
                ['Agro-negócio', '/categoria/agro-negocio'],
                ['Curiosidade', '/categoria/curiosidade'],
              ]}
            />
            <FooterColumn
              title="Sectores"
              links={[
                ['Sector agrário', '/categoria/sector-agrario'],
                ['Fruticultura', '/categoria/fruticultura'],
                ['Agro-pecuária', '/categoria/agro-pecuaria'],
                ['Apicultura', '/categoria/apicultura'],
                ['Ambiente', '/categoria/ambiente'],
              ]}
            />
            <FooterColumn
              title="Destaques"
              links={[
                ['Oportunidades', '/categoria/oportunidades'],
                ['Segurança alimentar', '/categoria/seguranca-alimentar'],
                ['Meios de vida', '/categoria/meios-de-vida'],
                ['Receitas', '/categoria/receitas'],
                ['Entrevistas', '/categoria/entrevista'],
              ]}
            />
            <FooterColumn
              title="Mais"
              links={[
                ['Sobre nós', '/pagina/inicio'],
                ['Contactos', '/pagina/contactos'],
                ['Acervo', '/pagina/acervo'],
                ['Entrar', '/login'],
                ['Registar', '/register'],
              ]}
            />
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5 text-[10px] text-gray-500">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/logo.png" alt="EntreCAMPOS" className="h-8 w-auto" />
            <span>© {new Date().getFullYear()} EntreCAMPOS — Agricultura Sustentável em Moçambique</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h5 className="mb-3 text-[12px] font-bold">{title}</h5>
      <ul className="space-y-2 text-gray-600">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-[#2bb673]">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
