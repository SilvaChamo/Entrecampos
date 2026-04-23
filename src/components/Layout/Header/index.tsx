"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { MapPin, Mail, Menu, X, Search, PenLine, LogIn } from "lucide-react";

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showTopBar, setShowTopBar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();

  // Controlar visibilidade da barra preta ao scrollar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Esconde a barra preta quando scrolla para baixo
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setShowTopBar(false);
      } else {
        // Mostra quando scrolla para cima
        setShowTopBar(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const categoryItems = [
    { name: "INÍCIO", href: "/inicio" },
    { name: "AGRICULTURA", href: "/categoria/agricultura" },
    { name: "SECTOR AGRÁRIO", href: "/categoria/sector-agrario" },
    { name: "COMUNIDADE", href: "/categoria/comunidade" },
    { name: "AMBIENTE", href: "/categoria/ambiente" },
    { name: "TURISMO RURAL", href: "/categoria/turismo-rural" },
    { name: "MULHER AGRÁRIO", href: "/categoria/mulher-agrario" },
    { name: "CURIOSIDADE", href: "/categoria/curiosidade" },
    { name: "CONTACTOS", href: "/pagina/contactos" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href) && href !== "#";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/pesquisa?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <>
      {/* Barra PRETA - Endereço, email e redes sociais */}
      <div
        className={`fixed left-0 right-0 z-[70] bg-black transition-transform duration-300 ${
          showTopBar ? "translate-y-0 top-0" : "-translate-y-full top-0"
        }`}
      >
        <div className="container mx-auto px-4 h-[40px] flex items-center justify-between">
          {/* Esquerda - Endereço e Email */}
          <div className="flex items-center gap-4 text-white text-sm">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Av.Karl Marx nº 177</span>
            </div>
            <span className="text-gray-500">|</span>
            <div className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>geral@entrecampos.co.mz</span>
            </div>
          </div>

          {/* Direita - Redes sociais */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/258000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white hover:bg-green-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-red-600 flex items-center justify-center text-white hover:bg-red-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center text-white hover:opacity-90 transition-opacity"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Container das barras cinzenta + verde (ficam juntas no scroll) */}
      <div className="fixed left-0 right-0 z-[60] top-[40px] transition-all duration-300">
        {/* Barra CINZENTA - Busca e ações */}
        <div className="bg-[#404040] border-b border-gray-600">
          <div className="container mx-auto px-4 h-[60px] flex items-center justify-between gap-4">
            {/* Logo central */}
            <Link href="/inicio" className="hidden md:block">
              <span className="text-2xl font-bold">
                <span className="text-red-500">Entre</span>
                <span className="text-green-500">CAMPOS</span>
              </span>
            </Link>

            {/* Botão Escrever Artigo */}
            <Link
              href="/escrever-artigo"
              className="hidden lg:flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition-colors border border-gray-500"
            >
              <PenLine className="w-4 h-4" />
              Escrever artigo
            </Link>

            {/* Barra de pesquisa */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl flex">
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-white text-gray-700 text-sm rounded-l-md border-0 focus:outline-none focus:ring-0"
              />
              <button
                type="submit"
                className="bg-red-600 text-white px-5 py-2 rounded-r-md text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </form>

            {/* Botão Entrar */}
            <Link
              href="/auth/login"
              className="hidden md:flex items-center gap-2 bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-600 transition-colors border border-gray-500"
            >
              <LogIn className="w-4 h-4" />
              Entrar
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-white"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Barra VERDE - Categorias */}
        <div className="bg-green-700 shadow-md">
          <div className="container mx-auto px-4">
            <nav className="hidden lg:flex items-center justify-center h-[45px] gap-1">
              {categoryItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors ${
                    isActive(item.href)
                      ? "bg-red-600 text-white"
                      : "text-white hover:bg-green-600"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile/Tablet Category Nav */}
            <div className="lg:hidden h-[45px] flex items-center">
              <span className="text-white text-sm font-medium">Menu de Categorias</span>
            </div>
          </div>
        </div>
      </div>

      {/* Espaçamento para o conteúdo (altura das 2 barras fixas: 60px + 45px = 105px) */}
      <div className="h-[145px]" />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[80] bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="absolute right-0 top-0 h-full w-[280px] bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="font-bold text-lg">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Search mobile */}
              <form onSubmit={handleSearch} className="flex">
                <input
                  type="text"
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-100 text-sm rounded-l-md border-0"
                />
                <button
                  type="submit"
                  className="bg-red-600 text-white px-3 py-2 rounded-r-md"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>

              {/* Categories mobile */}
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Categorias</p>
                {categoryItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-3 py-2 text-sm rounded ${
                      isActive(item.href)
                        ? "bg-green-100 text-green-700 font-medium"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 space-y-2">
                <Link
                  href="/escrever-artigo"
                  className="flex items-center gap-2 text-gray-700 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <PenLine className="w-4 h-4" />
                  Escrever artigo
                </Link>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 text-gray-700 py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  Entrar
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
