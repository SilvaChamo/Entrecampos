'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  Newspaper, 
  ImageIcon, 
  Users, 
  Settings, 
  Plus, 
  ExternalLink,
  ChevronDown,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  FileText,
  Clock,
  CheckSquare,
  FileUp,
  CreditCard,
  Eye,
  Video,
  Zap,
  Shield,
  BarChart3,
  FolderOpen,
  FileImage,
  FileVideo,
  File,
  LogIn,
  Layers,
  Boxes
} from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  submenu?: { label: string; href: string }[];
  isOpen?: boolean;
  onToggle?: () => void;
}

const SidebarItem = ({ href, icon: Icon, label, active, submenu, isOpen = false, onToggle }: SidebarItemProps) => {
  const pathname = usePathname();
  const isChildActive = submenu?.some(item => pathname === item.href);
  const [isHovered, setIsHovered] = useState(false);
  const isDashboard = label === 'Dashboard';

  // Expand if child becomes active (e.g. clicking from flyout)
  React.useEffect(() => {
    if (isChildActive && !isOpen && onToggle) onToggle();
  }, [isChildActive]);
  
  return (
    <div 
      className="w-full relative group/item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {isDashboard ? (
          <div 
            className={`flex items-center justify-between px-4 py-2 text-[14px] transition-colors border-l-[3px] border-transparent ml-[10px] ${
              active 
                ? 'bg-[#00a651] text-white border-[#00a651]' 
                : 'text-[#f0f0f1] hover:text-white hover:bg-[#2c3338] hover:border-[#00a651]'
            }`}
          >
            <Link href={href} className="flex items-center gap-3 flex-1">
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-[#8c8f94] group-hover/item:text-white'}`} />
              <span className="font-medium">{label}</span>
            </Link>
            {submenu && (
              <ChevronDown 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onToggle) onToggle();
                }}
                className={`w-4 h-4 cursor-pointer transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            )}
          </div>
        ) : (
          <div className={`flex items-center justify-between px-4 py-2 text-[14px] transition-colors border-l-[3px] border-transparent ml-[10px] ${
            active 
              ? 'bg-[#00a651] text-white border-[#00a651]' 
              : 'text-[#f0f0f1] hover:text-white hover:bg-[#2c3338] hover:border-[#00a651]'
          }`}>
            <Link href={href} className="flex items-center gap-3 flex-1">
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-[#8c8f94] group-hover/item:text-white'}`} />
              <span className="font-medium">{label}</span>
            </Link>
            {submenu && (
              <ChevronDown 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (onToggle) onToggle();
                }}
                className={`w-4 h-4 cursor-pointer transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              />
            )}
          </div>
        )}

        {/* Hover Flyout Submenu (WordPress style) */}
        {submenu && isHovered && !isOpen && (
          <div className="absolute left-full top-0 w-48 bg-[#2c3338] shadow-xl z-[1000] border-l border-[#3c434a] py-2">
            <div className="px-4 py-1 mb-1 text-[13px] font-bold text-[#f0f0f1] border-b border-[#3c434a] pb-2">
              {label}
            </div>
            {submenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-4 py-1.5 text-[13px] hover:text-[#00a651] transition-colors border-l-[3px] border-transparent ml-[10px] ${
                  pathname === item.href ? 'text-[#00a651] border-[#00a651]' : 'text-[#f0f0f1] hover:border-[#00a651]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Inline Expanded Submenu */}
      {submenu && isOpen && (
        <div className="bg-[#0d1214] py-1 border-b border-[#2c3338]">
          {submenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-1.5 text-[13px] hover:text-[#00a651] transition-colors border-l-[3px] border-transparent ml-[10px] ${
                pathname === item.href ? 'text-[#00a651] border-[#00a651]' : 'text-[#f0f0f1] hover:border-[#00a651]'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { user, logout, setRole } = useAuth();

  const handleToggleSubmenu = (label: string) => {
    setOpenSubmenu(prev => prev === label ? null : label);
  };

  // Fechar submenu quando navegar para página fora do multimídia
  React.useEffect(() => {
    if (openSubmenu === 'Multimédia' && !pathname.startsWith('/admin/media')) {
      setOpenSubmenu(null);
    }
  }, [pathname, openSubmenu]);

  const getMenuItems = (role: UserRole) => {
    const items: any[] = [
      { 
        href: role === 'admin' ? '/admin/dashboard' : (role === 'editor' ? '/admin/editor' : (role === 'contribuidor' ? '/admin/contribuidor' : '/admin/guest')), 
        icon: LayoutDashboard, 
        label: 'Dashboard',
        submenu: role === 'admin' ? [
          { label: 'Editor', href: '/admin/editor' },
          { label: 'Contribuidor', href: '/admin/contribuidor' },
          { label: 'Visitante', href: '/admin/guest' },
        ] : undefined
      },
    ];

    if (role === 'admin') {
      items.push(
        { 
          href: '/admin/noticias', 
          icon: Newspaper, 
          label: 'Notícias',
          submenu: [
            { label: 'Todas as Notícias', href: '/admin/noticias' },
            { label: 'Adicionar Nova', href: '/admin/noticias/nova' },
            { label: 'Notícias Pendentes', href: '/admin/noticias/pendentes' },
            { label: 'Categorias', href: '/admin/noticias/categorias' },
            { label: 'Etiquetas', href: '/admin/noticias/etiquetas' },
            { label: 'Reparar Imagens', href: '/admin/noticias/reparar' },
          ]
        },
        { 
          href: '/admin/media', 
          icon: ImageIcon, 
          label: 'Multimédia',
          submenu: [
            { label: 'Biblioteca', href: '/admin/media' },
            { label: 'Limpeza de Media', href: '/admin/media/limpeza' },
          ]
        },
        { 
          href: '/admin/utilizadores', 
          icon: Users, 
          label: 'Utilizadores',
          submenu: [
            { label: 'Todos os utilizadores', href: '/admin/utilizadores' },
            { label: 'Adicionar utilizador', href: '/admin/utilizadores/novo' },
            { label: 'O seu perfil', href: '/admin/perfil' },
          ]
        },
        { 
          href: '/admin/litespeed', 
          icon: Zap, 
          label: 'LiteSpeed Cache',
          submenu: [
            { label: 'Otimização da página', href: '/admin/litespeed' },
            { label: 'Limpeza de cache', href: '/admin/litespeed/limpeza' },
            { label: 'Configurações', href: '/admin/litespeed/configuracoes' },
          ]
        },
        { 
          href: '/admin/capacidades', 
          icon: Shield, 
          label: 'Capacidades',
          submenu: [
            { label: 'Redirecionamentos', href: '/admin/capacidades/redirecionamentos' },
            { label: 'Gerir capacidades', href: '/admin/capacidades' },
            { label: 'Recursos', href: '/admin/capacidades/recursos' },
          ]
        },
        { 
          href: '/admin/trafego', 
          icon: BarChart3, 
          label: 'Visitor Traffic',
          submenu: [
            { label: 'Estatísticas em tempo real', href: '/admin/trafego' },
            { label: 'Relatórios detalhados', href: '/admin/trafego/relatorios' },
            { label: 'Visitantes por país', href: '/admin/trafego/paises' },
          ]
        },
        { 
          href: '/admin/partilhado', 
          icon: FolderOpen, 
          label: 'Partilhado',
          submenu: [
            { label: 'Geral', href: '/admin/partilhado' },
            { label: 'Vídeos', href: '/admin/partilhado/videos' },
            { label: 'Imagens', href: '/admin/partilhado/imagens' },
            { label: 'Documentos', href: '/admin/partilhado/documentos' },
          ]
        },
        { 
          href: '/admin/definicoes', 
          icon: Settings, 
          label: 'Definições',
          submenu: [
            { label: 'Geral', href: '/admin/definicoes' },
            { label: 'Notícias', href: '/admin/definicoes/noticias' },
            { label: 'Utilizadores', href: '/admin/definicoes/utilizadores' },
            { label: 'Media', href: '/admin/definicoes/media' },
            { label: 'Segurança', href: '/admin/definicoes/seguranca' },
            { label: 'Backup', href: '/admin/definicoes/backup' },
            { label: 'API & Integrações', href: '/admin/definicoes/api' },
          ]
        },
      );
    }

    if (role === 'editor') {
      items[0].href = '/admin/editor';
      items.push(
        { href: '/admin/noticias/pendentes', icon: Clock, label: 'Notícias Pendentes' },
        { href: '/admin/noticias/revistas', icon: CheckSquare, label: 'Últimos Revistos' },
        { href: '/admin/noticias', icon: Newspaper, label: 'Todas as Notícias' },
      );
    }

    if (role === 'contribuidor') {
      items[0].href = '/admin/contribuidor';
      items.push(
        { href: '/admin/noticias/nova', icon: Plus, label: 'Escrever Notícia' },
        { href: '/admin/contribuicoes', icon: FileUp, label: 'Minhas Contribuições' },
        { 
          href: '/admin/media', 
          icon: ImageIcon, 
          label: 'Multimédia',
          submenu: [
            { label: 'Biblioteca', href: '/admin/media' },
            { label: 'Adicionar novo', href: '/admin/media/novo' },
          ]
        },
      );
    }

    if (role === 'guest') {
      items[0].href = '/admin/guest';
      items.push(
        { href: '/admin/noticias', icon: Eye, label: 'Ver Notícias' },
        { href: '/admin/media', icon: Video, label: 'Ver Vídeos' },
        { href: '/admin/noticias/nova', icon: Plus, label: 'Escrever Notícia' },
        { href: '/admin/planos', icon: CreditCard, label: 'Planos e Preços' },
      );
    }

    return items;
  };

  const menuItems = getMenuItems(user?.role || 'guest');

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f0f1]">
      {/* Admin Bar (Barra Superior Preta) */}
      <header className="sticky top-0 z-[100] h-8 bg-[#1d2327] text-[#f0f0f1] flex items-center justify-between px-4 text-[13px]">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 hover:text-[#72aee6]">
            <Settings className="w-4 h-4" />
            <span className="font-bold">EntreCampos</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/admin/noticias/nova" className="flex items-center gap-1.5 hover:text-[#72aee6]">
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </Link>
            <Link href="/" target="_blank" className="flex items-center gap-1.5 hover:text-[#72aee6]">
              <ExternalLink className="w-4 h-4" />
              <span>Ver Site</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4 group cursor-pointer relative">
          <span className="capitalize">Olá, {user?.name || 'Visitante'} ({user?.role || 'guest'})</span>
          <UserIcon className="w-4 h-4 bg-[#2c3338] p-0.5 rounded-full" />
          
          <div className="absolute right-0 top-8 w-48 bg-[#2c3338] shadow-lg border border-[#3c434a] hidden group-hover:block p-2 rounded-md">
            <Link href="/admin/perfil" className="flex items-center gap-2 px-3 py-2 text-[#f0f0f1] hover:text-[#ff3333] text-[13px] rounded-md transition-colors">
              <UserIcon className="w-4 h-4" /> Ver Perfil
            </Link>
            {/* Quick role switch for testing */}
            <div className="border-t border-[#3c434a] mt-2 pt-2 px-3 text-[10px] text-gray-400 uppercase">Trocar Role (Teste)</div>
            {(['admin', 'editor', 'contribuidor', 'guest'] as UserRole[]).map(r => (
              <button 
                key={r}
                onClick={() => setRole(r)}
                className={`w-full text-left px-3 py-1 text-[11px] hover:text-[#72aee6] ${user?.role === r ? 'text-[#2271b1] font-bold' : 'text-gray-300'}`}
              >
                {r}
              </button>
            ))}
            <button 
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-[#f0f0f1] hover:text-[#ff3333] text-[13px] border-t border-[#3c434a] mt-2 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Menu Lateral) */}
        <aside 
          className={`bg-[#1d2327] transition-all duration-200 flex-shrink-0 ${
            isSidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
          }`}
        >
          <nav className="mt-0">
            {menuItems.map((item) => {
              const isChildActive = (item as any).submenu?.some((sub: any) => pathname === sub.href);
              const isParentActive = pathname === item.href;
              const isActive = isParentActive || isChildActive;
              const shouldBeOpen = openSubmenu === item.label || isChildActive;
              
              return (
                <SidebarItem 
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  submenu={(item as any).submenu}
                  active={isActive}
                  isOpen={shouldBeOpen}
                  onToggle={() => handleToggleSubmenu(item.label)}
                />
              );
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Toggle Sidebar Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="fixed bottom-4 left-4 z-50 p-2 bg-[#1d2327] text-[#f0f0f1] rounded-full shadow-lg hover:bg-[#2c3338]"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
