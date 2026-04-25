'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SimpleHeader = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Início', href: '/inicio' },
    { name: 'Sobre nós', href: '/pagina/inicio' },
    { name: 'Notícias', href: '#noticias' },
    { name: 'Mercado', href: '/categoria/agro-negocio' },
    { name: 'Acervo', href: '/admin/media' },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200">
      {/* Logo e Menu Row */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/inicio">
            <img 
              src="https://ppgmtxzuaxqshipnvebl.supabase.co/storage/v1/object/public/news-images/eCAMPOS_Logo_whiteBG-01.png" 
              alt="EntreCAMPOS" 
              className="h-14 w-auto"
            />
          </Link>
          
          {/* MENU - Mesma linha */}
          <nav className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {menuItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className={`block px-4 py-2 text-[15px] font-medium transition-colors ${
                      pathname === item.href 
                        ? 'text-red-600' 
                        : 'text-gray-700 hover:text-red-600'
                    }`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Botão Subscrever */}
          <Link 
            href="/planos"
            className="bg-red-600 text-white px-6 py-2 rounded-[8px] text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Subscrever
          </Link>
        </div>
      </div>
    </header>
  );
};

export default SimpleHeader;
