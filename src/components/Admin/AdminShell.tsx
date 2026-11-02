'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Boxes,
  Loader2,
  MessageSquare
} from 'lucide-react';
import Spinner from '@/components/Common/Spinner';

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
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // ecrã grande: barra aberta/recolhida
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // telemóvel: gaveta, sempre fechada ao entrar
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const { user, loading, logout, setRole, realRole, viewAs, setViewAs } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Mobile: cada célula das tabelas de listas ganha o nome da sua coluna (o CSS mostra-o quando a tabela vira cartões).
  useEffect(() => {
    let frame = 0;
    const label = () => {
      document.querySelectorAll<HTMLTableElement>('.ec-admin table:not(.ec-cards)').forEach((table) => {
        const heads: string[] = [];
        table.querySelectorAll('thead th').forEach((th) => {
          const span = (th as HTMLTableCellElement).colSpan || 1;
          for (let i = 0; i < span; i++) heads.push((th.textContent || '').trim());
        });
        if (heads.length === 0) return;
        table.querySelectorAll('tbody > tr').forEach((tr) => {
          let col = 0;
          Array.from(tr.children).forEach((cell) => {
            const c = cell as HTMLTableCellElement;
            const text = c.colSpan > 1 ? '' : heads[col] || '';
            if (c.getAttribute('data-label') !== text) c.setAttribute('data-label', text);
            col += c.colSpan || 1;
          });
        });
      });
    };
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(label);
    };
    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      mo.disconnect();
    };
  }, [pathname]);

  // O visitante (guest) não tem acesso à galeria de fotos: se abrir o endereço à mão, volta ao seu painel.
  useEffect(() => {
    if (user?.role === 'guest' && pathname.startsWith('/admin/media')) router.replace('/admin/guest');
  }, [user?.role, pathname, router]);

  // O administrador que abre o painel de outro papel passa a vê-lo "como" esse papel (páginas e menu reais).
  useEffect(() => {
    if (realRole !== 'admin') return;
    if (pathname.startsWith('/admin/editor')) setViewAs('editor');
    else if (pathname.startsWith('/admin/contribuidor')) setViewAs('contribuidor');
    else if (pathname.startsWith('/admin/guest')) setViewAs('guest');
    else if (pathname.startsWith('/admin/dashboard')) setViewAs(null);
  }, [pathname, realRole, setViewAs]);

  // No telemóvel o menu fecha ao mudar de página; Esc fecha menu e gaveta.
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      router.replace('/login');
    }
  };

  const handleToggleSubmenu = (label: string) => {
    setOpenSubmenu(prev => prev === label ? null : label);
  };

  // Fechar submenu quando navegar para página fora do multimídia
  useEffect(() => {
    if (openSubmenu === 'Multimédia' && !pathname.startsWith('/admin/media')) {
      setOpenSubmenu(null);
    }
  }, [pathname, openSubmenu]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center">
        <Spinner size={32} className="" />
      </div>
    );
  }

  const getMenuItems = (role: UserRole) => {
    const items: any[] = [
      { 
        href: role === 'admin' ? '/admin/dashboard' : (role === 'editor' ? '/admin/editor' : (role === 'contribuidor' ? '/admin/contribuidor' : '/admin/guest')), 
        icon: LayoutDashboard, 
        label: 'Dashboard',
        submenu: role === 'admin' ? [
          { label: 'Dashboard Principal', href: '/admin/dashboard' },
          { label: 'Painel Editor', href: '/admin/editor' },
          { label: 'Painel Contribuidor', href: '/admin/contribuidor' },
          { label: 'Painel Visitante', href: '/admin/guest' },
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
        { href: '/admin/comentarios', icon: MessageSquare, label: 'Comentários' },
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
        { href: '/admin/comentarios', icon: MessageSquare, label: 'Comentários' },
        { href: '/admin/noticias/revistas', icon: CheckSquare, label: 'Últimos Revistos' },
        { href: '/admin/noticias', icon: Newspaper, label: 'Todas as Notícias' },
        { href: '/admin/media', icon: ImageIcon, label: 'Multimédia' },
      );
    }

    if (role === 'contribuidor') {
      items[0].href = '/admin/contribuidor';
      items.push(
        { href: '/admin/noticias/nova', icon: Plus, label: 'Escrever Notícia' },
        {
          href: '/admin/noticias',
          icon: Newspaper,
          label: 'Notícias',
          submenu: [
            { label: 'Todas as Notícias', href: '/admin/noticias' },
            { label: 'Categorias', href: '/admin/noticias/categorias' },
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
      );
    }

    if (role === 'guest') {
      items[0].href = '/admin/guest';
      items.push(
        { href: '/admin/noticias/nova', icon: Plus, label: 'Adicionar Notícia' },
      );
    }

    return items;
  };

  const menuItems = getMenuItems(user?.role || 'guest');

  return (
    <div className={`ec-admin flex flex-col h-[100dvh] bg-[#f0f0f1] ${viewAs ? 'ec-viewing-as' : ''}`}>
      {/* Admin Bar (Barra Superior Preta) */}
      <header className="sticky top-0 z-[100] h-12 lg:h-8 bg-[#1d2327] text-[#f0f0f1] flex items-center justify-between gap-2 px-3 lg:px-4 text-[13px]">
        <div className="flex min-w-0 items-center gap-3 lg:gap-6">
          {/* Telemóvel: botão do menu lateral (gaveta) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded hover:bg-[#2c3338]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="flex items-center gap-2 hover:text-[#72aee6]">
            <Settings className="w-4 h-4 max-sm:hidden" />
            <span className="font-bold">EntreCampos</span>
          </Link>
          
          <div className="flex items-center gap-3 lg:gap-4">
            {/* "Novo" sempre à vista (também no telemóvel): escrever e publicar uma notícia */}
            <Link href="/admin/noticias/nova" className="flex items-center gap-1.5 hover:text-[#72aee6] max-lg:bg-[#2271b1] max-lg:px-3 max-lg:py-2 max-lg:rounded max-lg:text-white">
              <Plus className="w-4 h-4" />
              <span>Novo</span>
            </Link>
            <Link href="/" target="_blank" className="hidden md:flex items-center gap-1.5 hover:text-[#72aee6]">
              <ExternalLink className="w-4 h-4" />
              <span>Ver Site</span>
            </Link>
          </div>
        </div>

        <div className="flex shrink-0 items-center group relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((o) => !o)}
            aria-expanded={userMenuOpen}
            aria-label="Menu do utilizador"
            className="flex h-10 items-center gap-2 px-1 lg:h-8"
          >
            <span className="capitalize max-sm:hidden">Olá, {user?.name || 'Visitante'} ({user?.role || 'guest'})</span>
            <UserIcon className="w-7 h-7 lg:w-4 lg:h-4 bg-[#2c3338] p-1 lg:p-0.5 rounded-full" />
          </button>

          <div className={`absolute right-0 top-full w-56 bg-[#2c3338] shadow-lg border border-[#3c434a] p-2 rounded-md lg:group-hover:block ${userMenuOpen ? 'block' : 'hidden'}`}>
            <div className="sm:hidden px-3 py-2 text-[12px] text-gray-300 border-b border-[#3c434a] mb-1 capitalize break-words">{user?.name || 'Visitante'} · {user?.role || 'guest'}</div>
            <Link href="/admin/perfil" className="flex items-center gap-2 px-3 py-3 lg:py-2 text-[#f0f0f1] hover:text-[#ff3333] text-[13px] rounded-md transition-colors">
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
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-[#f0f0f1] hover:text-[#ff3333] text-[13px] border-t border-[#3c434a] mt-2 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        </div>
      </header>

      {/* Administrador a ver o painel de outro papel: avisa e permite voltar sem sair do painel */}
      {viewAs && (
        <div className="sticky top-12 z-[99] flex flex-wrap items-center justify-between gap-2 bg-[#d63638] px-4 py-1.5 text-[12px] text-white lg:top-8">
          <span>
            A ver o painel como <strong className="capitalize">{viewAs === 'guest' ? 'visitante' : viewAs}</strong>. Só muda o que vê no ecrã: o que gravar continua a ser feito com a sua conta de Administrador.
          </span>
          <button
            type="button"
            onClick={() => {
              setViewAs(null);
              router.push('/admin/dashboard');
            }}
            className="bg-[#1d2327] px-3 py-1 font-semibold text-white hover:bg-black"
          >
            Voltar a Administrador
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Telemóvel: fundo que fecha a gaveta ao tocar fora */}
        {mobileMenuOpen && (
          <button type="button" aria-label="Fechar menu" onClick={() => setMobileMenuOpen(false)} className="lg:hidden fixed inset-x-0 bottom-0 top-12 z-[90] bg-black/50" />
        )}
        {/* Sidebar (Menu Lateral): no telemóvel é uma gaveta (fechada ao entrar); no ecrã grande, a barra de sempre */}
        <aside
          className={`bg-[#1d2327] flex-shrink-0 transition-transform duration-200 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-12 max-lg:z-[95] max-lg:w-72 max-lg:max-w-[85vw] max-lg:overflow-y-auto ${
            mobileMenuOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
          } lg:transition-all ${isSidebarOpen ? 'lg:w-56' : 'lg:w-0 lg:overflow-hidden'}`}
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
        <main className="min-w-0 flex-1 overflow-y-auto">
          {/* Toggle Sidebar Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="max-lg:hidden fixed bottom-4 left-4 z-50 p-2 bg-[#1d2327] text-[#f0f0f1] rounded-full shadow-lg hover:bg-[#2c3338]"
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
