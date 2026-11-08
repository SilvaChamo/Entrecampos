'use client';

import React, { useEffect, useLayoutEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/context/AuthContext';
import {
  User as UserIcon,
  FolderOpen,
  BarChart3,
  LayoutDashboard,
  Newspaper,
  ImageIcon,
  Users,
  Settings,
  Plus,
  ExternalLink,
  ChevronDown,
  LogOut,
  LogIn,
  Menu,
  X,
  Clock,
  CheckSquare,
  MessageSquare,
  Mail,
  ShieldCheck,
  Pencil,
  FilePlus,
  Eye,
  FileText,
  CreditCard,
  MailCheck,
  LayoutTemplate,
  Share2,
} from 'lucide-react';
import Spinner from '@/components/Common/Spinner';
import { prefetchAdminNews } from '@/lib/admin-cache';

interface SidebarItemProps {
  href: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
  submenu?: { label: string; href: string }[];
  isOpen?: boolean;
  onToggle?: () => void;
}

/** Quem clica num link do menu para a página onde já está não a recarrega: avisa-se a página para voltar ao início (ex.: fechar a pasta aberta). */
const avisarNavegacao = (href: string) => window.dispatchEvent(new CustomEvent('ec-nav', { detail: href }));

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
            className={`group/slide flex items-center justify-between px-4 py-2 text-[14px] transition-colors border-l-[3px] border-transparent ml-[10px] ${
              active 
                ? 'bg-[#00a651] text-white border-[#00a651]' 
                : 'text-[#f0f0f1] hover:text-[#39ff14] hover:bg-[#25442f] hover:border-[#00a651]'
            }`}
          >
            <Link href={href} onClick={() => avisarNavegacao(href)} className="flex items-center gap-3 flex-1 transition-transform duration-300 ease-out group-hover/slide:translate-x-1.5 motion-reduce:group-hover/slide:translate-x-0">
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-[#8c8f94] group-hover/item:text-[#39ff14]'}`} />
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
          <div className={`group/slide flex items-center justify-between px-4 py-2 text-[14px] transition-colors border-l-[3px] border-transparent ml-[10px] ${
            active 
              ? 'bg-[#00a651] text-white border-[#00a651]' 
              : 'text-[#f0f0f1] hover:text-[#39ff14] hover:bg-[#25442f] hover:border-[#00a651]'
          }`}>
            <Link href={href} onClick={() => avisarNavegacao(href)} className="flex items-center gap-3 flex-1 transition-transform duration-300 ease-out group-hover/slide:translate-x-1.5 motion-reduce:group-hover/slide:translate-x-0">
              <Icon className={`w-5 h-5 transition-colors ${active ? 'text-white' : 'text-[#8c8f94] group-hover/item:text-[#39ff14]'}`} />
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
          <div className="absolute left-full top-0 w-48 bg-[#1f3a2b] shadow-xl z-[1000] border-l border-[#2b4a39] py-2">
            <div className="px-4 py-1 mb-1 text-[13px] font-bold text-[#f0f0f1] border-b border-[#2b4a39] pb-2">
              {label}
            </div>
            {submenu.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => avisarNavegacao(item.href)}
                className={`group/sub block px-4 py-1.5 text-[13px] hover:text-[#39ff14] transition-colors border-l-[3px] border-transparent ml-[10px] ${
                  pathname === item.href ? 'text-[#00a651] border-[#00a651]' : 'text-[#f0f0f1] hover:border-[#00a651]'
                }`}
              >
                <span className="inline-block transition-transform duration-300 ease-out group-hover/sub:translate-x-1.5 motion-reduce:group-hover/sub:translate-x-0">{item.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Inline Expanded Submenu */}
      {submenu && isOpen && (
        <div className="bg-[#0c1b13] py-1 border-b border-[#1f3a2b]">
          {submenu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => avisarNavegacao(item.href)}
              className={`group/sub block px-4 py-1.5 text-[13px] hover:text-[#39ff14] transition-colors border-l-[3px] border-transparent ml-[10px] ${
                pathname === item.href ? 'text-[#00a651] border-[#00a651]' : 'text-[#f0f0f1] hover:border-[#00a651]'
              }`}
            >
              <span className="inline-block transition-transform duration-300 ease-out group-hover/sub:translate-x-1.5 motion-reduce:group-hover/sub:translate-x-0">{item.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/** Páginas iniciais do painel (cada papel tem a sua): só nelas aparece o botão "Novo". */
const PANEL_HOME = ['/admin', '/admin/dashboard', '/admin/editor', '/admin/contribuidor', '/admin/colunista', '/admin/guest'];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // ecrã grande: barra aberta/recolhida
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // telemóvel: gaveta, sempre fechada ao entrar
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  // Depois de o utilizador abrir/fechar um submenu à mão, só fica aberto o que ele escolheu (os outros fecham-se);
  // ao mudar de página volta a abrir-se só o submenu da página onde está.
  const [pickedByHand, setPickedByHand] = useState(false);
  const { user, loading, logout, setRole, realRole, viewAs, setViewAs } = useAuth();

  // Galeria aberta só para escolher uma foto (a partir da notícia): já abre sem a barra lateral, sem a ver encolher.
  const [snapSidebar, setSnapSidebar] = useState(false);
  // Foto da conta: a do perfil ou, se não houver, a do Gravatar (ligada ao e-mail). Sem foto, mostra o ícone.
  const [gravatar, setGravatar] = useState<string | null>(null);
  const [photoFailed, setPhotoFailed] = useState(false);
  const accountEmail = user?.email || '';
  useEffect(() => {
    setPhotoFailed(false);
    setGravatar(null);
    if (!accountEmail || typeof crypto === 'undefined' || !crypto.subtle) return;
    let alive = true;
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(accountEmail.trim().toLowerCase())).then((buf) => {
      const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      if (alive) setGravatar(`https://www.gravatar.com/avatar/${hex}?d=404&s=64`);
    }).catch(() => {});
    return () => { alive = false; };
  }, [accountEmail]);
  const photo = photoFailed ? null : (user?.avatarUrl || gravatar);
  const ROLE_NAME: Record<string, string> = { admin: 'Administrador', editor: 'Editor', contribuidor: 'Contribuidor', guest: 'Visitante' };
  useLayoutEffect(() => {
    if (!new URLSearchParams(window.location.search).has('escolher')) return;
    setSnapSidebar(true);
    setIsSidebarOpen(false);
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setSnapSidebar(false)));
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Ao entrar no painel, a lista de notícias (a mesma de Notícias, Pendentes, Revistas, Arquivadas e Lixo) vai buscar-se logo
  // em segundo plano: quando se abre uma dessas páginas, já está pronta.
  useEffect(() => {
    if (!user) return;
    const timer = window.setTimeout(() => void prefetchAdminNews(), 1200);
    return () => window.clearTimeout(timer);
  }, [user]);

  // Sinal de vida: o Dashboard conta com ele quem está logado agora (só com o separador visível).
  useEffect(() => {
    if (!user) return;
    const ping = () => {
      if (document.visibilityState === 'visible') fetch('/api/admin/presence', { method: 'POST', credentials: 'include' }).catch(() => {});
    };
    ping();
    const timer = setInterval(ping, 60_000);
    document.addEventListener('visibilitychange', ping);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', ping);
    };
  }, [user]);

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

  const handleToggleSubmenu = (label: string, isOpen: boolean) => {
    setPickedByHand(true);
    setOpenSubmenu(isOpen ? null : label);
  };

  // Ao mudar de página, só o submenu dessa página fica aberto.
  useEffect(() => {
    setPickedByHand(false);
    setOpenSubmenu(null);
  }, [pathname]);

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
            { label: 'Notícias por e-mail', href: '/admin/noticias-email' },
            { label: 'Categorias', href: '/admin/noticias/categorias' },
            { label: 'Etiquetas', href: '/admin/noticias/etiquetas' },
            { label: 'Reparar Imagens', href: '/admin/noticias/reparar' },
          ]
        },
        {
          href: '/admin/opiniao',
          icon: FileText,
          label: 'Artigos de Opinião',
          submenu: [
            { label: 'Todos os artigos', href: '/admin/opiniao' },
            { label: 'Pendentes', href: '/admin/opiniao/pendentes' },
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
          href: '/admin/arquivo',
          icon: FolderOpen,
          label: 'Arquivo do site',
          submenu: [
            { label: 'Arquivo de fotos', href: '/admin/arquivo' },
            { label: 'Arquivos partilhados', href: '/admin/partilhado' },
            { label: 'PDF', href: '/admin/partilhado/pdf' },
            { label: 'Arquivos ZIP', href: '/admin/partilhado/zip' },
            { label: 'Documentos', href: '/admin/partilhado/documentos' },
          ]
        },
        {
          href: '/admin/subscricoes',
          icon: CreditCard,
          label: 'Subscrições',
          submenu: [
            { label: 'Pedidos e assinantes', href: '/admin/subscricoes' },
            { label: 'Planos e pagamento', href: '/admin/subscricoes/planos' },
            { label: 'Notícias exclusivas', href: '/admin/subscricoes/exclusivas' },
          ]
        },
        { href: '/admin/home', icon: LayoutTemplate, label: 'Página inicial' },
        { href: '/admin/newsletter', icon: Mail, label: 'Newsletter' },
        { href: '/admin/redes-sociais', icon: Share2, label: 'Redes sociais' },
        { href: '/admin/trafego', icon: BarChart3, label: 'Estatísticas' },
        { href: '/admin/comentarios', icon: MessageSquare, label: 'Comentários' },
      );
    }

    if (role === 'editor') {
      items[0].href = '/admin/editor';
      items.push(
        { href: '/admin/noticias/pendentes', icon: Clock, label: 'Notícias Pendentes' },
        { href: '/admin/noticias-email', icon: MailCheck, label: 'Notícias por e-mail' },
        { href: '/admin/subscricoes/exclusivas', icon: CreditCard, label: 'Notícias exclusivas' },
        { href: '/admin/noticias/revistas', icon: CheckSquare, label: 'Últimos Revistos' },
        { href: '/admin/noticias', icon: Newspaper, label: 'Todas as Notícias' },
        {
          href: '/admin/opiniao',
          icon: FileText,
          label: 'Artigos de Opinião',
          submenu: [
            { label: 'Todos os artigos', href: '/admin/opiniao' },
            { label: 'Pendentes', href: '/admin/opiniao/pendentes' },
          ]
        },
        { href: '/admin/media', icon: ImageIcon, label: 'Multimédia' },
        { href: '/admin/comentarios', icon: MessageSquare, label: 'Comentários' },
        {
          href: '/admin/arquivo',
          icon: FolderOpen,
          label: 'Arquivo do site',
          submenu: [
            { label: 'Arquivo de fotos', href: '/admin/arquivo' },
            { label: 'Arquivos partilhados', href: '/admin/partilhado' },
            { label: 'PDF', href: '/admin/partilhado/pdf' },
            { label: 'Arquivos ZIP', href: '/admin/partilhado/zip' },
            { label: 'Documentos', href: '/admin/partilhado/documentos' },
          ]
        },
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
        { href: '/admin/arquivo', icon: FolderOpen, label: 'Arquivo do site' },
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

  // Colunista (com ou sem o segundo nível editor): só tem "Meus artigos" (lista dos seus artigos e botão de escrever).
  // Nome do nível das contas de colunista (a sessão do colunista-editor tem papel editor, mas o nível dele é Colunista editor).
  const colunistaLabel = user?.colunista ? (user.role === 'editor' ? 'Colunista editor' : 'Colunista') : '';
  const menuItems = user?.colunista
    ? [
        { href: '/admin/colunista', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/noticias/nova', icon: Plus, label: 'Escrever artigo' },
        { href: '/admin/meus-artigos', icon: FileText, label: 'Meus artigos' },
      ]
    : getMenuItems(user?.role || 'guest');

  return (
    <div className={`ec-admin flex flex-col h-[100dvh] bg-[#f0f0f1] ${viewAs ? 'ec-viewing-as' : ''}`}>
      {/* Admin Bar (Barra Superior Preta) */}
      <header className="sticky top-0 z-[100] h-12 lg:h-8 bg-[#0c1b13] text-[#f0f0f1] flex items-center justify-between gap-2 px-3 lg:px-4 text-[13px]">
        <div className="flex min-w-0 items-center gap-3 lg:gap-6">
          {/* Telemóvel: botão do menu lateral (gaveta) */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileMenuOpen}
            className="lg:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded hover:bg-[#1f3a2b]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/" className="flex items-center gap-2 hover:text-[#72aee6]">
            <Settings className="w-4 h-4 max-sm:hidden" />
            <span className="font-bold">EntreCampos</span>
          </Link>
          
          <div className="flex items-center gap-3 lg:gap-4">
            {/* "Novo" só na página inicial do painel e só no computador (no telemóvel não aparece) */}
            {PANEL_HOME.includes(pathname) && (
              <Link href="/admin/noticias/nova" className="flex items-center gap-1.5 hover:text-[#72aee6] max-lg:hidden">
                <Plus className="w-4 h-4" />
                <span>Novo</span>
              </Link>
            )}
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
            <span className="capitalize max-sm:hidden">Olá, {user?.name || 'Visitante'} ({colunistaLabel || user?.role || 'guest'})</span>
            <UserIcon className="w-8 h-8 lg:w-6 lg:h-6 bg-[#1f3a2b] p-1.5 lg:p-1 rounded-full" />
          </button>

          <div className={`absolute right-0 top-full w-56 bg-[#1f3a2b] shadow-lg border border-[#2b4a39] p-1 rounded-md lg:group-hover:block ${userMenuOpen ? 'block' : 'hidden'}`}>
            <div className="sm:hidden px-3 py-1.5 text-[12px] text-gray-300 border-b border-[#2b4a39] mb-1 capitalize break-words">{user?.name || 'Visitante'} · {user?.role || 'guest'}</div>
            <Link href="/admin/perfil" className="flex items-center gap-2 px-3 py-2 text-[#f0f0f1] hover:text-[#39ff14] text-[12px] rounded-md transition-colors">
              <UserIcon className="w-4 h-4" /> Ver Perfil
            </Link>
            <div className="mt-1 h-px bg-[#00a651]/40" />
            {/* Quick role switch for testing */}
            <div className="-mx-1 flex h-9 items-center bg-[#12251a] px-4 text-[11px] tracking-wide text-gray-300 uppercase">Trocar papel</div>
            <div className="divide-y divide-[#2b4a39] border-y border-[#2b4a39]">
            {(['admin', 'editor', 'contribuidor', 'guest'] as UserRole[]).map(r => (
              <button 
                key={r}
                onClick={() => setRole(r)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-[12px] capitalize transition-colors hover:text-[#39ff14] ${user?.role === r ? 'text-[#39ff14]' : 'text-gray-200'}`}
              >
                {(() => { const RI = { admin: ShieldCheck, editor: Pencil, contribuidor: FilePlus, guest: Eye }[r]; return <RI className="h-4 w-4" />; })()}
                {r === 'guest' ? 'Visitante' : r}
              </button>
            ))}
            </div>
            <button 
              onClick={handleLogout}
              className="mt-1 flex h-9 w-full items-center gap-2 rounded-md bg-[#12251a] px-3 text-[13px] text-[#f0f0f1] transition-colors hover:text-[#ff3333]"
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
            className="bg-[#14281d] px-3 py-1 font-semibold text-white hover:bg-black"
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
          className={`bg-[#1a3326] flex-shrink-0 transition-transform duration-200 flex flex-col max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-12 max-lg:z-[95] max-lg:w-72 max-lg:max-w-[85vw] ${
            mobileMenuOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'
          } ${snapSidebar ? '' : 'lg:transition-all'} ${isSidebarOpen ? 'lg:w-56' : 'lg:w-0 lg:overflow-hidden'}`}
        >
          <nav className="mt-0 min-h-0 flex-1 max-lg:overflow-y-auto">
            {menuItems.map((item) => {
              const isChildActive = (item as any).submenu?.some((sub: any) => pathname === sub.href);
              const isParentActive = pathname === item.href;
              const isActive = isParentActive || isChildActive;
              const shouldBeOpen = pickedByHand ? openSubmenu === item.label : isChildActive;
              
              return (
                <SidebarItem 
                  key={item.href}
                  href={item.href}
                  icon={item.icon}
                  label={item.label}
                  submenu={(item as any).submenu}
                  active={isActive}
                  isOpen={shouldBeOpen}
                  onToggle={() => handleToggleSubmenu(item.label, shouldBeOpen)}
                />
              );
            })}
          </nav>

          {/* Conta com sessão iniciada: foto, e-mail e tipo de conta, no fundo escuro dos submenus. O botão de recolher fica fora da barra, na mesma linha. */}
          <div className="flex h-14 shrink-0 items-center gap-2.5 bg-[#0c1b13] px-4" title={user?.email || ''}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" referrerPolicy="no-referrer" onError={() => setPhotoFailed(true)} className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1f3a2b] text-[#f0f0f1]"><UserIcon className="h-4 w-4" /></span>
            )}
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[12px] text-[#f0f0f1]">{user?.email || user?.name || 'Visitante'}</span>
              <span className="block truncate text-[11px] text-[#8fb39d]">{colunistaLabel || ROLE_NAME[realRole || user?.role || 'guest']}</span>
            </span>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="min-w-0 flex-1 overflow-y-auto">
          {/* Toggle Sidebar Button */}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? 'Recolher a barra lateral' : 'Expandir a barra lateral'}
            title={isSidebarOpen ? 'Recolher a barra lateral' : 'Expandir a barra lateral'}
            className={`max-lg:hidden fixed bottom-0 z-50 flex h-14 w-10 items-center justify-center rounded-r-md bg-[#0c1b13] text-[#f0f0f1] shadow-lg transition-[left] duration-200 hover:text-[#39ff14] ${isSidebarOpen ? 'left-56' : 'left-0'}`}
          >
            {/* Expandir: seta a entrar; recolher: o mesmo ícone virado ao contrário */}
            <LogIn className={`h-5 w-5 ${isSidebarOpen ? '-scale-x-100' : ''}`} />
          </button>

          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
