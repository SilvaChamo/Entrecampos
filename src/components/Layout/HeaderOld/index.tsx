"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown } from "lucide-react";

const HeaderOld: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [offCanvasOpen, setOffCanvasOpen] = useState(false);
  const [offCanvasMode, setOffCanvasMode] = useState<'menu' | 'login' | 'subscribe'>('menu');
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const pathname = usePathname();

  const mainNavItems = [
    { name: "Início", href: "/inicio", hasDropdown: false },
    { name: "Home", href: "/", hasDropdown: false },
    { name: "Categorias", href: "/categorias", hasDropdown: false },
    { name: "Notícias", href: "#noticias", hasDropdown: false },
    { name: "Sobre", href: "/pagina/inicio", hasDropdown: false },
    { name: "Contactos", href: "/pagina/contactos", hasDropdown: false },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href) && href !== "#";
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "INÍCIO", href: "/inicio" },
    { name: "AGRICULTURA", href: "/categoria/agricultura" },
    { name: "SECTOR AGRÁRIO", href: "/categoria/agro-negocio" },
    { name: "COMUNIDADE", href: "/categoria/comunidade" },
    { name: "AMBIENTE", href: "/categoria/ambiente" },
    { name: "TURISMO RURAL", href: "/categoria/turismo-rural" },
    { name: "MULHER AGRÁRIO", href: "/categoria/mulher-agrario" },
    { name: "CURIOSIDADE", href: "/categoria/curiosidade" },
    { name: "CONTACTOS", href: "/pagina/contactos" },
  ];

  return (
    <header>
      {/* LINHA 1: Endereço, Email e Redes Sociais */}
      <div className="bg-black text-white py-2 px-4">
        <div className="container mx-auto flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Av.Karl Marx nº 177
            </span>
            <span className="text-green-500">|</span>
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              geral@entrecampos.co.mz
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="#" className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </Link>
            <Link href="#" className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </Link>
            <Link href="#" className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </Link>
            <Link href="#" className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center hover:bg-green-500 transition-colors">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </Link>
            {/* Menu Off-Canvas Button */}
            <button 
              onClick={() => {
                setOffCanvasMode('menu');
                setOffCanvasOpen(true);
              }}
              className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center hover:bg-red-500 transition-colors ml-2"
            >
              <Menu className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* LINHA 2: Logotipo */}
      <div
        className="relative py-4"
        style={{
          backgroundImage: "url(https://entrecampos.co.mz/wp-content/uploads/2021/06/bgg-01.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="container mx-auto px-4 relative z-10 flex justify-center">
          <Link href="/inicio">
            <Image
              src="https://entrecampos.co.mz/wp-content/uploads/2024/07/Logo.png"
              alt="EntreCAMPOS"
              width={400}
              height={100}
              className="h-16 w-auto"
              priority
            />
          </Link>
        </div>
      </div>

      {/* LINHA 3: Botões, Busca e Login */}
      <div className={`py-5 transition-all duration-300 ${isScrolled ? 'fixed top-0 left-0 right-0 z-50 shadow-lg' : ''}`} style={{ backgroundColor: "#1a3d0c" }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4">
            <Link href="#" className="border border-white text-white px-6 py-2 rounded-full text-sm hover:bg-white hover:text-gray-800 transition-colors">
              Escrever artigo
            </Link>

            <div className="flex" style={{ width: '550px', height: '40px' }}>
              <input
                type="text"
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 text-gray-800 focus:outline-none rounded-l-full text-sm"
              />
              <button className="bg-red-600 text-white px-6 rounded-r-full font-semibold hover:bg-red-700 transition-colors text-sm">
                Search
              </button>
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-400 flex items-center justify-center overflow-hidden">
                  <svg className="w-7 h-7 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <button onClick={() => setIsLoggedIn(false)} className="border border-white text-white px-6 py-2 rounded-full text-sm hover:bg-white hover:text-gray-800 transition-colors">
                  Sair
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setOffCanvasMode('login');
                  setOffCanvasOpen(true);
                }} 
                className="border border-white text-white px-[30px] py-2 rounded-full text-sm hover:bg-white hover:text-gray-800 transition-colors"
              >
                Entrar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* LINHA 4: Navegação Principal */}
      <nav className={`text-white transition-all duration-300 ${isScrolled ? 'fixed top-16 left-0 right-0 z-50 shadow-lg' : ''}`} style={{ backgroundColor: "#2d5016" }}>
        <div className="h-[1px]" style={{ backgroundColor: "#32d932" }}></div>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-red-600 text-white font-bold'
                        : 'text-green-100 hover:text-white'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            <button onClick={() => setNavbarOpen(!navbarOpen)} className="lg:hidden p-2 text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {navbarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {navbarOpen && (
            <div className="lg:hidden py-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`block px-4 py-2 text-sm font-semibold uppercase ${
                      isActive ? "bg-red-600" : "hover:bg-green-600"
                    }`}
                    onClick={() => setNavbarOpen(false)}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* OFF-CANVAS MENU */}
      <div 
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${offCanvasOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        {/* Overlay */}
        <div 
          className="absolute inset-0 bg-black/50"
          onClick={() => setOffCanvasOpen(false)}
        />
        
        {/* Sidebar com animação slide */}
        <div 
          className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl z-50 flex flex-col overflow-hidden transition-transform duration-300 ease-out ${offCanvasOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          {/* Header do Off-Canvas */}
          <div className="flex items-center justify-between py-5 px-4 border-b border-red-600" style={{ backgroundColor: '#2d2d2d' }}>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  setOffCanvasMode('login');
                  setOffCanvasOpen(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-500 transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  setOffCanvasMode('subscribe');
                  setOffCanvasOpen(true);
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Subscrever
              </button>
            </div>
            <button 
              onClick={() => setOffCanvasOpen(false)}
              className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          {/* Conteúdo do Off-Canvas */}
          <div className="flex-1 overflow-y-auto">
            {offCanvasMode === 'login' ? (
              /* Modo Login - Formulários de Login e Registo */
              <div className="flex flex-col min-h-full">
                <div className="p-4 space-y-4 flex-1">
                  {/* Botão Voltar */}
                  <button
                    onClick={() => setOffCanvasMode('menu')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors text-sm font-medium"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Voltar
                  </button>
                  {/* Formulário de Login */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Entrar</h3>
                    <form className="space-y-2">
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      />
                      <input
                        type="password"
                        placeholder="Senha"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      />
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Entrar
                      </button>
                    </form>
                  </div>

                  {/* Linha separadora suave */}
                  <div className="border-t border-gray-300 pt-4">
                    <p className="text-xs text-gray-500 text-center mb-2">Ainda não tem conta?</p>
                  </div>

                  {/* Formulário de Registo */}
                  <div className="rounded-lg p-4" style={{ background: 'linear-gradient(135deg, #1a3d0c 0%, #2d5a1a 100%)' }}>
                    <h3 className="text-sm font-semibold text-white mb-3">Criar Conta</h3>
                    <form className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nome completo"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      />
                      <input
                        type="password"
                        placeholder="Senha"
                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      />
                      <button
                        type="submit"
                        className="w-full bg-green-600 text-white py-2 text-sm font-medium rounded-lg hover:bg-green-500 transition-colors"
                      >
                        Registar
                      </button>
                    </form>
                  </div>
                </div>

                {/* Rodapé */}
                <div className="py-5 px-4 border-t border-green-600" style={{ backgroundColor: '#6b6b6b' }}>
                  <div className="flex items-center justify-between gap-3">
                    {/* Signa-nos - não clicável */}
                    <div className="border-2 border-white text-white px-5 py-2 rounded-full text-sm font-medium">
                      Signa-nos
                    </div>
                    
                    {/* Redes Sociais */}
                    <div className="flex items-center gap-2">
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#25D366' }}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1877F2' }}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      </Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#FF0000' }}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : offCanvasMode === 'subscribe' ? (
              /* Modo Subscrição - Formulário de planos */
              <div className="flex flex-col min-h-full">
                <div className="p-4 space-y-4 flex-1">
                  {/* Botão Voltar - só seta */}
                  <button
                    onClick={() => setOffCanvasMode('menu')}
                    className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                  </button>

                  <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Escolha o seu Plano</h3>
                  </div>

                  {/* Opções de Subscrição */}
                  <div className="space-y-3">
                    <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left">
                      <div className="flex items-center justify-between">
                        <div><h4 className="font-semibold text-gray-800">Parceiro</h4><p className="text-sm text-gray-500">Para empresas e colaboradores</p></div>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      </div>
                    </button>
                    <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left">
                      <div className="flex items-center justify-between">
                        <div><h4 className="font-semibold text-gray-800">Gratuito</h4><p className="text-sm text-gray-500">Acesso básico sem custos</p></div>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      </div>
                    </button>
                    <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left">
                      <div className="flex items-center justify-between">
                        <div><h4 className="font-semibold text-gray-800">Básico</h4><p className="text-sm text-gray-500">Funcionalidades essenciais</p></div>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      </div>
                    </button>
                    <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all text-left">
                      <div className="flex items-center justify-between">
                        <div><h4 className="font-semibold text-gray-800">Premium</h4><p className="text-sm text-gray-500">Acesso completo e exclusivo</p></div>
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300"></div>
                      </div>
                    </button>
                  </div>

                  <div className="text-center pt-4">
                    <Link href="#" className="text-green-600 hover:text-green-700 text-sm font-medium underline" onClick={() => setOffCanvasOpen(false)}>Ver planos e preços detalhados →</Link>
                  </div>

                  <button className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors mt-4">Continuar</button>
                </div>

                {/* Rodapé */}
                <div className="py-5 px-4 border-t border-green-600" style={{ backgroundColor: '#6b6b6b' }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="border-2 border-white text-white px-5 py-2 rounded-full text-sm font-medium">Signa-nos</div>
                    <div className="flex items-center gap-2">
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#25D366' }}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1877F2' }}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#FF0000' }}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Modo Menu - Menu Normal + Contacto */
              <div className="flex flex-col min-h-full">
                <nav className="p-4 space-y-0 flex-1">
                  {mainNavItems.map((item, index) => (
                    <div key={item.name} className={`${index > 0 ? 'border-t border-gray-100' : ''}`}>
                      <Link
                        href={item.href}
                        className={`block px-4 py-[6px] text-sm font-medium rounded-lg transition-colors ${
                          isActive(item.href)
                            ? 'text-red-600'
                            : 'text-gray-700 hover:text-red-600'
                        }`}
                        onClick={() => setOffCanvasOpen(false)}
                      >
                        {item.name}
                      </Link>
                    </div>
                  ))}
                  
                  {/* Formulário de Contacto Minimalista */}
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <form className="space-y-2 bg-gray-50 border border-gray-200 rounded-lg p-3">
                      <input
                        type="text"
                        placeholder="Nome"
                        className="w-full px-3 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-3 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
                      />
                      <textarea
                        placeholder="Mensagem"
                        rows={2}
                        className="w-full px-3 py-3 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-none"
                      />
                      <div className="flex justify-start">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-6 py-2 text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Enviar
                        </button>
                      </div>
                    </form>
                  </div>
                </nav>

                {/* Rodapé */}
                <div className="py-5 px-4 border-t border-green-600" style={{ backgroundColor: '#6b6b6b' }}>
                  <div className="flex items-center justify-between gap-3">
                    {/* Signa-nos - não clicável */}
                    <div className="border-2 border-white text-white px-5 py-2 rounded-full text-sm font-medium">
                      Signa-nos
                    </div>
                    
                    {/* Redes Sociais */}
                    <div className="flex items-center gap-2">
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#25D366' }}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#1877F2' }}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ backgroundColor: '#FF0000' }}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></Link>
                      <Link href="#" className="w-8 h-8 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg></Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderOld;
