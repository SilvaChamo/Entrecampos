import Link from 'next/link';

type LinkItem = { nome: string; href: string };

const LINKS_RAPIDOS: LinkItem[] = [
  { nome: 'Início', href: '/' },
  { nome: 'Últimas notícias', href: '/noticias' },
  { nome: 'Todas as categorias', href: '/categorias' },
  { nome: 'Contactos', href: '/pagina/contactos' },
];

const LINKS_INTERNOS: LinkItem[] = [
  { nome: 'Agricultura', href: '/categoria/agricultura' },
  { nome: 'Sector agrário', href: '/categoria/sector-agrario' },
  { nome: 'Comunidade', href: '/categoria/comunidade' },
  { nome: 'Ambiente', href: '/categoria/ambiente' },
  { nome: 'Turismo rural', href: '/categoria/turismo-rural' },
  { nome: 'Mulher agrário', href: '/categoria/mulher-agrario' },
  { nome: 'Curiosidade', href: '/categoria/curiosidade' },
];

const LINKS_APOIO: LinkItem[] = [
  { nome: 'Contactos', href: '/pagina/contactos' },
  { nome: 'Sobre nós', href: '/pagina/inicio' },
  { nome: 'Categorias', href: '/categorias' },
  { nome: 'Área reservada', href: '/login' },
];

function Titulo({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-white text-xs font-bold uppercase tracking-widest mb-5 pb-2 border-b-2 border-green-600 inline-block">
      {children}
    </h4>
  );
}

function ListaLinks({ titulo, links }: { titulo: string; links: LinkItem[] }) {
  return (
    <nav aria-label={titulo}>
      <Titulo>{titulo}</Titulo>
      <ul className="space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-gray-400 text-sm hover:text-green-400 transition-colors">
              {l.nome}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const Footer = () => {
  const ano = new Date().getFullYear();

  return (
    <footer className="w-full">
      <div className="bg-[#1d2327] py-14 px-4">
        <div className="container mx-auto grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <ListaLinks titulo="Links rápidos" links={LINKS_RAPIDOS} />
          <ListaLinks titulo="Links internos" links={LINKS_INTERNOS} />

          {/* SOBRE A EMPRESA */}
          <div>
            <Titulo>Sobre a empresa</Titulo>
            <Link href="/" className="block mb-4">
              <img src="/images/logo.png" alt="EntreCAMPOS" className="h-12 w-auto" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Jornal dedicado à agricultura, ao ambiente e à vida das comunidades rurais.
            </p>
            <Link href="/pagina/inicio" className="text-green-500 text-sm font-semibold hover:text-green-400 transition-colors">
              Saber mais →
            </Link>
          </div>

          {/* NEWSLETTER */}
          <div>
            <Titulo>Newsletter</Titulo>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              Receba as notícias do mundo rural diretamente no seu e-mail.
            </p>
            <form className="flex flex-col gap-3" aria-label="Subscrever newsletter">
              <label htmlFor="footer-newsletter" className="sr-only">E-mail</label>
              <input
                id="footer-newsletter"
                type="email"
                placeholder="O seu e-mail"
                className="h-11 px-4 rounded-full outline-none text-gray-800 text-sm"
              />
              <button
                type="submit"
                className="bg-[#3e6611] text-white h-11 rounded-full font-bold uppercase text-xs tracking-wider hover:bg-green-700 transition-colors"
              >
                Subscrever
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* COPYRIGHT + LINKS DE APOIO */}
      <div className="bg-black py-5 px-4 border-t border-gray-800">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-gray-400 text-[11px] tracking-wide">
          <p className="text-center md:text-left">
            Copyright © {ano} <span className="text-white">EntreCAMPOS.com</span> | Powered by{' '}
            <span className="text-green-500">VisualDESIGN</span> Services, Lda.
          </p>
          <nav aria-label="Links de apoio">
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1">
              {LINKS_APOIO.map((l) => (
                <li key={l.nome}>
                  <Link href={l.href} className="hover:text-white transition-colors">
                    {l.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
