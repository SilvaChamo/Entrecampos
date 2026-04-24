'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Search, 
  MapPin, 
  Mail, 
  Facebook, 
  Twitter, 
  Instagram, 
  Phone,
  User,
  LogOut,
  PenSquare
} from 'lucide-react';
import { usePathname } from 'next/navigation';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
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
    { name: 'GESTÃO', href: '#', hasDropdown: true, items: [
      { name: 'Galeria de Media', href: '/admin/media' },
      { name: 'Gerir Notícias', href: '/admin/noticias' },
      { name: 'Nova Notícia', href: '/admin/noticias/nova' },
    ]},
    { name: 'CONTACTOS', href: '/pagina/contactos' },
  ];

  return (
    <header className="w-full">
      {/* TOP BAR (Preta) */}
      <div className="bg-black text-white text-[11px] py-2 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-green-500" />
              <span>Av. Karl Marx nº 177</span>
            </div>
            <span className="text-gray-600">|</span>
            <div className="flex items-center gap-1">
              <Mail className="w-3 h-3 text-green-500" />
              <span>geral@ecamposmz.com</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="#" className="hover:text-green-500 transition-colors"><Phone className="w-3.5 h-3.5" /></Link>
            <Link href="#" className="hover:text-green-500 transition-colors"><Facebook className="w-3.5 h-3.5" /></Link>
            <Link href="#" className="hover:text-green-500 transition-colors"><Twitter className="w-3.5 h-3.5" /></Link>
            <Link href="#" className="hover:text-green-500 transition-colors"><Instagram className="w-3.5 h-3.5" /></Link>
          </div>
        </div>
      </div>

      {/* MIDDLE BAR (Cinza Escuro) */}
      <div className="bg-[#2c3338] py-6 px-4">
        <div className="container mx-auto flex flex-col items-center gap-6">
          {/* Logo */}
          <Link href="/inicio" className="mb-2">
            <img 
              src="https://entrecampos.co.mz/wp-content/uploads/2024/07/Logo.png" 
              alt="EntreCAMPOS" 
              className="h-16 w-auto"
            />
          </Link>

          {/* Search and Buttons Row */}
          <div className="w-full max-w-5xl flex items-center gap-4">
            <Link 
              href="/admin/noticias/nova"
              className="bg-[#2c3338] border border-gray-400 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-gray-700 transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <PenSquare className="w-4 h-4" />
              Escrever artigo
            </Link>

            <div className="flex-1 flex">
              <input 
                type="text" 
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 px-4 rounded-l-md outline-none text-gray-800"
              />
              <button className="bg-red-600 text-white px-8 h-11 rounded-r-md font-bold hover:bg-red-700 transition-colors">
                Search
              </button>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                <User className="text-white w-6 h-6" />
              </div>
              <button className="bg-[#2c3338] border border-gray-400 text-white px-6 py-2 rounded-full text-sm font-medium hover:bg-gray-700 transition-all">
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORIES BAR (Verde Escuro) */}
      <nav className="bg-[#1a3d0c] border-b-4 border-[#2c3338]">
        <div className="container mx-auto px-4">
          <ul className="flex flex-wrap items-center justify-center">
            {categories.map((cat) => (
              <li key={cat.name} className="relative group">
                {cat.hasDropdown ? (
                  <>
                    <button className="flex items-center gap-1 px-4 py-3 text-[12px] font-bold text-white hover:bg-black/10 transition-colors uppercase">
                      {cat.name}
                    </button>
                    <div className="absolute top-full left-0 bg-[#1a3d0c] min-w-[180px] shadow-xl border-t border-white/10 hidden group-hover:block z-50">
                      {cat.items?.map(sub => (
                        <Link 
                          key={sub.name} 
                          href={sub.href}
                          className="block px-4 py-3 text-[11px] font-bold text-white hover:bg-black/20 transition-colors border-b border-white/5"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link 
                    href={cat.href}
                    className={`block px-4 py-3 text-[12px] font-bold text-white hover:bg-red-600 transition-colors ${
                      pathname === cat.href ? 'bg-red-600' : ''
                    }`}
                  >
                    {cat.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
