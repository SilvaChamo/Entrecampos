import Link from "next/link";
import localFont from "next/font/local";
import {
  Facebook,
  Plus,
  Search,
  User,
} from "lucide-react";
import SideNav from "@/components/Expnews/SideNav";
import GreenBar from "@/components/Expnews/GreenBar";
import ShareLink from "@/components/Expnews/ShareLink";
import NewsletterForm from "@/components/Forms/NewsletterForm";
import ExpFrame, { MenuToggle } from "@/components/Expnews/ExpFrame";
import styles from "@/components/Expnews/expnews.module.css";
import { FACEBOOK_URL } from "@/components/Site/parts";

// Saira (variável, pasta fornecida pelo cliente), servida localmente.
const saira = localFont({
  src: [
    {
      path: "../../fonts/saira/Saira-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../../fonts/saira/Saira-Italic-Variable.woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-expnews",
  display: "swap",
});

const RED = "bg-[#d6101c]";

const footTitle =
  "mb-6 inline-block border-b-2 border-[#d6101c] pb-2 text-[12px] font-bold uppercase tracking-widest text-white";

const QUICK_LINKS: [string, string][] = [
  ["Início", "/"],
  ["Notícias", "/noticias"],
  ["Sobre nós", "/pagina/inicio"],
  ["Contactos", "/pagina/contactos"],
];

const INTERNAL_LINKS: [string, string][] = [
  ["Agricultura", "/categoria/agricultura"],
  ["Sector agrário", "/categoria/sector-agrario"],
  ["Comunidade", "/categoria/comunidade"],
  ["Ambiente", "/categoria/ambiente"],
  ["Turismo rural", "/categoria/turismo-rural"],
  ["Mulher agrário", "/categoria/mulher-agrario"],
  ["Curiosidade", "/categoria/curiosidade"],
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
  const sidebar = (
    <>
      {/* Mesma altura do cabeçalho branco: o logótipo fica centrado na vertical com ele e cresce sem empurrar o menu */}
      <Link href="/" aria-label="EntreCAMPOS — início" className="relative block h-[66px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/entrecampos-icon.jpg"
          alt="EntreCAMPOS"
          width={512}
          height={512}
          className="absolute left-3 top-8 h-10 w-10 -translate-y-1/2 rounded-md bg-white object-contain transition-[width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[open=true]/side:h-[52px] group-data-[open=true]/side:w-[52px]"
        />
      </Link>
      <SideNav />
      <div className="flex w-16 shrink-0 justify-center py-3 text-gray-400">
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="hover:text-[#39ff14]"
        >
          <Facebook className="h-5 w-5" />
        </a>
      </div>
    </>
  );

  return (
    <div className={`${saira.variable} ${styles.root} min-h-screen`}>
      <ExpFrame sidebar={sidebar} topBar={<GreenBar />}>
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
              <div className="flex shrink-0 items-center gap-4 text-gray-700">
                <form action="/noticias" className="flex items-center gap-2 border-l border-gray-200 pl-4">
                  <button type="submit" aria-label="Pesquisar" className="hover:text-[#d6101c]">
                    <Search className="h-4 w-4" />
                  </button>
                  <input
                    name="q"
                    placeholder="Pesquisar"
                    className="hidden w-40 border-0 bg-transparent text-[13px] font-normal normal-case outline-none placeholder:font-normal placeholder:normal-case placeholder:text-gray-500 md:block lg:w-52 xl:w-56"
                  />
                </form>
                <span className="h-9 w-px bg-gray-200" />
                <Link
                  href="/admin/guest"
                  aria-label="Adicionar notícia"
                  className="flex items-center gap-1.5 bg-[#d6101c] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-white hover:bg-[#a30c15]"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Adicionar notícia</span>
                </Link>
                <Link
                  href="/login"
                  aria-label="Entrar"
                  title="Entrar"
                  className="flex h-9 w-9 items-center justify-center border border-gray-400 text-gray-700 transition-colors hover:border-[#d6101c] hover:text-[#d6101c]"
                >
                  <User className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </header>

        {children}

        {/* Rodapé: 4 colunas + barra de copyright */}
        <footer className="relative overflow-hidden bg-[#0b0b0b] text-gray-300">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {backdrop && (
            <img
              src={backdrop}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-25 grayscale"
            />
          )}
          {/* Camada escura por cima da foto */}
          <div aria-hidden="true" className="absolute inset-0 bg-black/50" />
          <div className="relative mx-auto grid max-w-[1280px] gap-x-12 gap-y-10 px-3 pb-0 pt-12 sm:grid-cols-2 lg:grid-cols-[1.5fr_0.8fr_0.9fr_1.3fr]">
            <div>
              <h4 className={footTitle}>Sobre a empresa</h4>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/logo.png" alt="EntreCAMPOS" className="mb-5 -ml-[13px] h-14 w-auto" />
              <p className="text-[13px] leading-6">
                O EntreCAMPOS é um jornal digital dedicado à agricultura sustentável, ao agro-negócio, ao ambiente e à vida das comunidades rurais em Moçambique.
              </p>
              <div className="mt-5 flex items-center gap-6">
                <Link href="/pagina/inicio" className="text-[12px] font-bold uppercase tracking-wider text-white hover:text-[#d6101c]">
                  Saber mais →
                </Link>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400 hover:text-white"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              </div>
            </div>
            <nav aria-label="Links rápidos">
              <h4 className={footTitle}>Links rápidos</h4>
              <ul className="space-y-1.5 text-[13px]">
                {QUICK_LINKS.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-[#d6101c]">{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <nav aria-label="Links internos">
              <h4 className={footTitle}>Links internos</h4>
              <ul className="space-y-1.5 text-[13px]">
                {INTERNAL_LINKS.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="hover:text-[#d6101c]">{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h4 className={footTitle}>Newsletter</h4>
              <p className="text-[13px] leading-6">
                Receba as melhores notícias do sector agrário em Moçambique diretamente no seu email. Deixe o seu endereço e entraremos em contacto.
              </p>
              <div className="[&_form]:mx-0 [&_form]:mt-3 [&_form]:max-w-none [&_form>div:nth-child(2)]:mb-[30px] [&_form>div:nth-child(2)]:mt-1 [&_input]:py-2 [&_input]:text-[13px] [&_button]:px-6 [&_p]:mt-1 [&_p]:leading-5">
                <NewsletterForm />
              </div>
            </div>
          </div>
          <div className="relative border-t border-white/10">
            <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-3 py-3 text-[10px] text-gray-500">
              <span>
                © {new Date().getFullYear()} EntreCAMPOS. Agricultura Sustentável em Moçambique.
              </span>
              <nav aria-label="Links de apoio" className="flex flex-wrap items-center gap-x-5 gap-y-1 font-bold uppercase tracking-wider">
                <Link href="/pagina/contactos" className="hover:text-white">Contactos</Link>
                <Link href="/pagina/inicio" className="hover:text-white">Sobre nós</Link>
                <Link href="/login" className="hover:text-white">Entrar</Link>
                <Link href="/register" className="hover:text-white">Registar</Link>
                <ShareLink path="/" title="EntreCAMPOS" className="bg-white/10 px-3 py-1 text-gray-300" />
              </nav>
            </div>
          </div>
        </footer>
      </ExpFrame>
    </div>
  );
}
