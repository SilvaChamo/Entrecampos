import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-entrecampos-green text-white py-8 mt-12">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">EntreCAMPOS</h3>
            <p className="text-green-100 text-sm">
              Promovendo a agricultura sustentável e o desenvolvimento rural em Moçambique através de informação, capacitação e inovação.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Links Rápidos</h4>
            <ul className="space-y-2 text-green-100">
              <li><Link href="/" className="hover:text-white">Início</Link></li>
              <li><Link href="/categoria/agricultura" className="hover:text-white">Agricultura</Link></li>
              <li><Link href="/categoria/agro-negocio" className="hover:text-white">Agro-negócio</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Contato</h4>
            <p className="text-green-100 text-sm">
              Moçambique<br />
              Email: info@entrecampos.co.mz
            </p>
          </div>
        </div>
        <div className="border-t border-green-600 mt-8 pt-8 text-center text-green-100 text-sm">
          <p>© 2026 EntreCAMPOS - Agricultura Sustentável. Desenvolvido com Next.js.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
