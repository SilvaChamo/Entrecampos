"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";

const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);
  const pathname = usePathname();

  const mainNavItems = [
    { 
      name: "Início", 
      href: "/inicio",
      hasDropdown: false 
    },
    { 
      name: "Home", 
      href: "/",
      hasDropdown: false 
    },
    { 
      name: "Categorias", 
      href: "#",
      hasDropdown: true,
      items: [
        { name: "Agricultura", href: "/categoria/agricultura" },
        { name: "Agro-negócio", href: "/categoria/agro-negocio" },
        { name: "Comunidade", href: "/categoria/comunidade" },
        { name: "Ambiente", href: "/categoria/ambiente" },
        { name: "Turismo Rural", href: "/categoria/turismo-rural" },
        { name: "Mulher Agrário", href: "/categoria/mulher-agrario" },
        { name: "Curiosidade", href: "/categoria/curiosidade" },
      ]
    },
    { 
      name: "Notícias", 
      href: "#noticias",
      hasDropdown: false 
    },
    { 
      name: "Sobre", 
      href: "/pagina/inicio",
      hasDropdown: false 
    },
    { 
      name: "Admin", 
      href: "#",
      hasDropdown: true,
      items: [
        { name: "Galeria de Media", href: "/admin/media" },
      ]
    },
    { 
      name: "Contactos", 
      href: "/pagina/contactos",
      hasDropdown: false 
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href) && href !== "#";
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/inicio" className="flex items-center">
            <Image
              src="https://entrecampos.co.mz/wp-content/uploads/2024/07/Logo.png"
              alt="EntreCAMPOS"
              width={180}
              height={50}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {mainNavItems.map((item) => (
              <div 
                key={item.name}
                className="relative"
                onMouseEnter={() => item.hasDropdown && setDropdownOpen(item.name)}
                onMouseLeave={() => setDropdownOpen(null)}
              >
                <Link
                  href={item.href}
                  className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                    isActive(item.href) || (item.hasDropdown && item.items?.some(sub => isActive(sub.href)))
                      ? 'text-green-600'
                      : 'text-gray-700 hover:text-green-600'
                  }`}
                >
                  {item.name}
                  {item.hasDropdown && (
                    <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen === item.name ? 'rotate-180' : ''}`} />
                  )}
                </Link>

                {/* Dropdown Menu */}
                {item.hasDropdown && dropdownOpen === item.name && (
                  <div className="absolute top-full left-0 mt-0 pt-2">
                    <div className="bg-white shadow-lg rounded-md border border-gray-100 py-2 min-w-[200px]">
                      {item.items?.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isActive(subItem.href)
                              ? 'bg-green-50 text-green-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-green-600'
                          }`}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Action Button */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="#"
              className="bg-red-600 text-white px-5 py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Subscrever
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-700"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-100 py-4">
            <nav className="flex flex-col gap-2">
              {mainNavItems.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className={`block px-4 py-3 text-sm font-medium rounded ${
                      isActive(item.href)
                        ? 'bg-green-50 text-green-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onClick={() => !item.hasDropdown && setMobileMenuOpen(false)}
                  >
                    <div className="flex items-center justify-between">
                      {item.name}
                      {item.hasDropdown && (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </Link>
                  
                  {/* Mobile Dropdown Items */}
                  {item.hasDropdown && item.items && (
                    <div className="pl-4 mt-1 space-y-1">
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          className={`block px-4 py-2 text-sm rounded ${
                            isActive(subItem.href)
                              ? 'bg-green-50 text-green-600'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  href="#"
                  className="block text-center bg-red-600 text-white px-5 py-3 rounded text-sm font-medium"
                >
                  Subscrever
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
