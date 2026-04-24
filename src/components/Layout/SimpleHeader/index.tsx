'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SimpleHeader = () => {
  const pathname = usePathname();

  const categories = [
    { name: 'INÍCIO', href: '/inicio' },
    { name: 'AGRICULTURA', href: '/categoria/agricultura' },
    { name: 'SECTOR AGRÁRIO', href: '/categoria/sector-agrario' },
    { name: 'COMUNIDADE', href: '/categoria/comunidade' },
    { name: 'AMBIENTE', href: '/categoria/ambiente' },
    { name: 'TURISMO RURAL', href: '/categoria/turismo-rural' },
    { name: 'MULHER AGRÁRIO', href: '/categoria/mulher-agrario' },
    { name: 'CURIOSIDADE', href: '/categoria/curiosidade' },
    { name: 'CONTACTOS', href: '/pagina/contactos' },
  ];

  return (
    <header className="w-full bg-white border-b border-gray-200">
      {/* Logo e Menu Row */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          {/* Logo */}
          <Link href="/inicio">
            <img 
              src="https://entrecampos.co.mz/wp-content/uploads/2024/07/Logo.png" 
              alt="EntreCAMPOS" 
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* CATEGORIES BAR - Fundo Branco */}
        <nav className="border-t border-gray-100 pt-3">
          <ul className="flex flex-wrap items-center justify-center gap-1">
            {categories.map((cat) => (
              <li key={cat.name}>
                <Link 
                  href={cat.href}
                  className={`block px-3 py-2 text-[11px] font-bold text-gray-700 hover:text-green-700 hover:bg-gray-50 rounded transition-colors uppercase ${
                    pathname === cat.href ? 'text-green-700 bg-gray-50' : ''
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default SimpleHeader;
