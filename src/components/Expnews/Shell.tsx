import Link from "next/link";
import localFont from "next/font/local";
import {
  Apple,
  Briefcase,
  Facebook,
  File,
  Home,
  Leaf,
  Lightbulb,
  Lock,
  Newspaper,
  Search,
  Send,
  Settings,
  Sprout,
  Users,
  Utensils,
} from "lucide-react";
import HomesMenu from "@/components/Home/HomesMenu";
import ShareLink from "@/components/Expnews/ShareLink";
import ExpFrame, { MenuToggle } from "@/components/Expnews/ExpFrame";
import GreenBar from "@/components/Expnews/GreenBar";
import styles from "@/components/Expnews/expnews.module.css";
import { FACEBOOK_URL } from "@/components/Site/parts";

// Saira (variável, pasta fornecida pelo cliente), servida localmente.
const saira = localFont({
  src: [
    {
      path: "../../fonts/saira/Saira-Variable.ttf",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../fonts/saira/Saira-Italic-Variable.ttf",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-expnews",
  display: "swap",
});

const RED = "bg-[#d6101c]";

const SIDE_NAV = [
  { label: "Notícias", href: "/noticias", Icon: Newspaper },
  { label: "Páginas", href: "/pagina/inicio", Icon: File },
  { label: "Agricultura", href: "/categoria/agricultura", Icon: Sprout },
  { label: "Comunidade", href: "/categoria/comunidade", Icon: Users },
  { label: "Agro-negócio", href: "/categoria/agro-negocio", Icon: Briefcase },
  { label: "Curiosidade", href: "/categoria/curiosidade", Icon: Lightbulb },
  { label: "Fruticultura", href: "/categoria/fruticultura", Icon: Apple },
  { label: "Oportunidades", href: "/categoria/oportunidades", Icon: Briefcase },
  { label: "Ambiente", href: "/categoria/ambiente", Icon: Leaf },
  { label: "Receitas", href: "/categoria/receitas", Icon: Utensils },
];

/**
 * Cabeçalho (barra lateral + barra superior) e rodapé do layout ExpNews.
 * Usado pela home principal e pela página de leitura.
 */
export default function ExpShell({
  children,
  backdrop,
}: {
  children: React.ReactNode;
  backdrop?: string;
}) {
  // Com a barra recolhida só ficam os ícones; os rótulos passam a popup ao passar o rato.
  const hideWhenCollapsed = "group-data-[collapsed=true]/side:hidden";
  const itemClass =
    "flex items-center gap-3 px-5 py-3 text-[12px] font-medium uppercase tracking-wide text-gray-200 hover:bg-white/5 hover:text-[#d6101c] group-data-[collapsed=true]/side:justify-center group-data-[collapsed=true]/side:px-0";

  const sidebar = (
    <>
      <Link
        href="/"
        aria-label="EntreCAMPOS — início"
        className="flex justify-start px-5 pb-5 pt-5 group-data-[collapsed=true]/side:justify-center group-data-[collapsed=true]/side:px-2"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/entrecampos-icon.jpg"
          alt="EntreCAMPOS"
          width={512}
          height={512}
          className="h-[104px] w-[104px] rounded-md bg-white object-contain transition-all group-data-[collapsed=true]/side:h-10 group-data-[collapsed=true]/side:w-10"
        />
      </Link>
      <nav className="flex-1">
        <HomesMenu
          label="Início"
          direction="right"
          icon={<Home className="h-[18px] w-[18px] shrink-0" />}
          labelClassName={hideWhenCollapsed}
          triggerClassName={`gap-3 px-5 py-3 text-[12px] font-medium uppercase tracking-wide text-[#d6101c] hover:bg-white/5 hover:text-white group-data-[collapsed=true]/side:justify-center group-data-[collapsed=true]/side:px-0`}
        />
        {SIDE_NAV.map(({ label, href, Icon }) => (
          <div key={label} className="group/item relative">
            <Link href={href} aria-label={label} className={itemClass}>
              <Icon className="h-[18px] w-[18px] shrink-0" />
              <span className={hideWhenCollapsed}>{label}</span>
            </Link>
            <span className="pointer-events-none absolute left-full top-1/2 z-[60] ml-1 hidden -translate-y-1/2 whitespace-nowrap bg-white px-4 py-2 text-[12px] font-medium text-gray-800 shadow-xl group-data-[collapsed=true]/side:group-hover/item:block">
              {label}
            </span>
          </div>
        ))}
      </nav>
      <div className="flex justify-center gap-2 px-5 pb-6 text-gray-400">
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="hover:text-white"
        >
          <Facebook className="h-[18px] w-[18px]" />
        </a>
      </div>
    </>
  );

  return (
    <div className={`${saira.variable} ${styles.root} min-h-screen`}>
      <ExpFrame sidebar={sidebar}>
        {/* Barra verde do site online: botões de acção e Facebook */}
        <GreenBar />

        {/* Cabeçalho: menu, logotipo, redes e pesquisa */}
        <header className="sticky top-0 z-30 mb-3 border-b-2 border-[#d6101c] bg-white shadow-sm">
          <div className="mx-3">
            <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3 py-3">
                <MenuToggle />
                <span className="h-9 w-px bg-gray-200" />
                <Link href="/" aria-label="EntreCAMPOS — início" className="shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/logo.png" alt="EntreCAMPOS" className="h-9 w-auto sm:h-10" />
                </Link>
              </div>
              <div className="flex shrink-0 items-center gap-4 pr-3 text-gray-700">
                <Link href="/login" aria-label="Entrar" className="hover:text-[#d6101c]">
                  <Lock className="h-4 w-4" />
                </Link>
                <Link href="/admin" aria-label="Painel" className="hover:text-[#d6101c]">
                  <Settings className="h-4 w-4" />
                </Link>
                <form action="/noticias" className="flex items-center gap-2 border-l border-gray-200 pl-4">
                  <input
                    name="q"
                    placeholder="Pesquisar"
                    className="hidden w-36 border-0 bg-transparent text-[12px] font-bold uppercase outline-none placeholder:text-gray-700 md:block"
                  />
                  <button type="submit" aria-label="Pesquisar" className="hover:text-[#d6101c]">
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>

        {children}

        {/* Newsletter */}
        <section className="relative overflow-hidden bg-black py-14 text-center text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {backdrop && (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale"
            />
          )}
          <div className="relative mx-auto max-w-xl px-4">
            <h3 className="text-[13px] font-bold uppercase tracking-widest">
              Subscreva a newsletter
            </h3>
            <p className="mt-3 text-[10px] leading-relaxed text-gray-300">
              Receba as melhores notícias do sector agrário em Moçambique. Deixe
              o seu email e entraremos em contacto.
            </p>
            <form
              action="/pagina/contactos"
              className="mx-auto mt-5 flex max-w-sm"
            >
              <input
                type="email"
                name="email"
                required
                placeholder="O seu email..."
                className="min-w-0 flex-1 bg-white px-3 py-2 text-[11px] text-gray-800 outline-none"
              />
              <button
                type="submit"
                aria-label="Enviar"
                className={`${RED} px-5 text-white hover:opacity-90`}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </section>

        {/* Rodapé */}
        <footer className="bg-[#0b0b0b] px-4 pb-6 pt-10 text-center text-gray-300">
          <nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-white">
            <Link href="/" className="hover:text-[#d6101c]">
              Início
            </Link>
            <Link href="/noticias" className="hover:text-[#d6101c]">
              Notícias
            </Link>
            <Link href="/pagina/inicio" className="hover:text-[#d6101c]">
              Sobre nós
            </Link>
            <Link href="/pagina/contactos" className="hover:text-[#d6101c]">
              Contactos
            </Link>
            <Link href="/login" className="hover:text-[#d6101c]">
              Entrar
            </Link>
            <Link href="/register" className="hover:text-[#d6101c]">
              Registar
            </Link>
          </nav>
          <div className="mt-8 flex items-center justify-center text-[9px] font-bold uppercase tracking-wider text-gray-400">
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-white"
            >
              <Facebook className="h-3.5 w-3.5" />
              Facebook
            </a>
          </div>
          <div className="mx-auto mt-10 flex max-w-[1280px] flex-wrap items-center justify-between gap-3 text-[9px] text-gray-500">
            <span>
              © {new Date().getFullYear()} EntreCAMPOS. Agricultura Sustentável
              em Moçambique.
            </span>
            <ShareLink
              path="/"
              title="EntreCAMPOS"
              className="bg-white/10 px-3 py-1 font-bold uppercase text-gray-300"
            />
          </div>
        </footer>
      </ExpFrame>
    </div>
  );
}
