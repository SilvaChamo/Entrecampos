'use client';

import React, { useState } from 'react';
import DashboardContent from './DashboardContent';
import { 
  LayoutDashboard,
  Newspaper,
  ImageIcon,
  Users,
  Settings,
  Zap,
  BarChart3,
  FolderOpen,
  Shield
} from 'lucide-react';

interface RolePreviewPanelProps {
  role: 'editor' | 'contribuidor' | 'guest';
}

export default function RolePreviewPanel({ role }: RolePreviewPanelProps) {
  const [currentView, setCurrentView] = useState('dashboard');
  
  const roleLabels: Record<string, string> = {
    editor: 'Editor',
    contribuidor: 'Contribuidor',
    guest: 'Visitante'
  };

  // Menu items baseados no que cada role pode ver (copiado do AdminShell)
  const getMenuItems = () => {
    const items: any[] = [];
    
    // Todos veem Dashboard
    items.push({ id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' });
    
    if (role === 'editor') {
      items.push(
        { id: 'noticias', icon: Newspaper, label: 'Notícias' },
        { id: 'media', icon: ImageIcon, label: 'Multimédia' },
        { id: 'perfil', icon: Users, label: 'Perfil' }
      );
    } else if (role === 'contribuidor') {
      items.push(
        { id: 'noticias', icon: Newspaper, label: 'Notícias' },
        { id: 'media', icon: ImageIcon, label: 'Multimédia' },
        { id: 'perfil', icon: Users, label: 'Perfil' }
      );
    } else if (role === 'guest') {
      items.push(
        { id: 'noticias', icon: Newspaper, label: 'Notícias' },
        { id: 'perfil', icon: Users, label: 'Perfil' }
      );
    }
    
    return items;
  };

  // Renderiza o conteúdo baseado na view atual
  // Usa os mesmos componentes do painel admin, apenas com forcedRole diferente
  const renderContent = () => {
    if (currentView === 'dashboard') {
      // Usa o DashboardContent existente com forcedRole
      return <DashboardContent forcedRole={role} />;
    }
    
    // Para outras views, mostra mensagem indicando que é preview
    return (
      <div className="p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">!</span>
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 text-sm">Visualização de Teste</h4>
              <p className="text-sm text-amber-700 mt-1">
                A página "{currentView}" como vista por um {roleLabels[role]}.
                No painel real, o utilizador veria o mesmo layout mas com dados filtrados pelas suas permissões.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-xl font-normal text-[#1d2327] mb-4">
            {currentView.charAt(0).toUpperCase() + currentView.slice(1)}
          </h2>
          <p className="text-[#50575e]">
            Esta página usa o mesmo layout e componentes do painel admin, 
            mas apenas mostra as funcionalidades permitidas para o papel <strong>{roleLabels[role]}</strong>.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full min-h-[600px] bg-[#f0f0f1]">
      {/* Sidebar interna - estilo consistente com AdminShell */}
      <aside className="w-44 bg-[#1d2327] text-[#f0f0f1] flex-shrink-0 flex flex-col">
        <div className="px-4 py-3 border-b border-[#2c3338]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-[#00a651] rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">E</span>
            </div>
            <span className="text-[13px] font-medium">EntreCAMPOS</span>
          </div>
          <div className="mt-2 text-[11px] text-[#8c8f94]">
            Modo: {roleLabels[role]}
          </div>
        </div>

        <nav className="py-2 flex-1">
          {getMenuItems().map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-[13px] transition-colors border-l-[3px] border-transparent text-left ${
                currentView === item.id
                  ? 'bg-[#00a651] text-white border-[#00a651]' 
                  : 'text-[#f0f0f1] hover:text-white hover:bg-[#2c3338]'
              }`}
            >
              <item.icon className={`w-4 h-4 ${currentView === item.id ? 'text-white' : 'text-[#8c8f94]'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-[#2c3338] text-[11px] text-[#8c8f94]">
          Testando como {roleLabels[role]}
        </div>
      </aside>

      {/* Main Content - Usa componentes reais do admin */}
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-[#ccd0d4]">
          <div className="text-[13px] text-[#50575e]">
            Visualizando como: <span className="font-semibold text-[#1d2327]">{roleLabels[role]}</span>
            <span className="mx-2">|</span>
            <span className="text-[#8c8f94]">Página: {currentView}</span>
          </div>
          <div className="text-[11px] text-[#8c8f94] bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
            Modo de teste - ações simuladas
          </div>
        </div>
        
        <div className="min-h-[500px]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
