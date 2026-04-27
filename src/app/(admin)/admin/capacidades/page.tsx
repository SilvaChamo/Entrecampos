'use client';

import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  Filter,
  Check,
  X,
  Info,
  ChevronDown,
  ChevronRight,
  Users,
  FileText,
  Image as ImageIcon,
  Settings,
  Layout,
  Database,
  Globe,
  BarChart3,
  Bell,
  Mail,
  Lock,
  Edit3,
  Trash2,
  Eye,
  Upload,
  Download,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';

const ROLES = [
  { id: 'admin', name: 'Administrador', description: 'Acesso total ao sistema' },
  { id: 'editor', name: 'Editor', description: 'Pode editar e publicar conteúdo' },
  { id: 'contribuidor', name: 'Contribuidor', description: 'Pode submeter conteúdo para revisão' },
  { id: 'subscriber', name: 'Subscritor', description: 'Acesso limitado apenas leitura' },
  { id: 'guest', name: 'Visitante', description: 'Acesso mínimo ao painel' }
];

const CAPABILITY_GROUPS = [
  {
    name: 'Artigos',
    icon: FileText,
    capabilities: [
      { name: 'ler_artigos', label: 'Ler artigos', description: 'Visualizar lista de artigos' },
      { name: 'editar_artigos', label: 'Editar artigos', description: 'Modificar conteúdo existente' },
      { name: 'criar_artigos', label: 'Criar artigos', description: 'Adicionar novos artigos' },
      { name: 'publicar_artigos', label: 'Publicar artigos', description: 'Tornar artigos visíveis publicamente' },
      { name: 'eliminar_artigos', label: 'Eliminar artigos', description: 'Remover artigos permanentemente' },
      { name: 'rever_artigos', label: 'Rever artigos pendentes', description: 'Aprovar ou rejeitar submissões' },
    ]
  },
  {
    name: 'Multimédia',
    icon: ImageIcon,
    capabilities: [
      { name: 'upload_imagens', label: 'Upload de imagens', description: 'Enviar imagens para a biblioteca' },
      { name: 'gerir_biblioteca', label: 'Gerir biblioteca', description: 'Organizar e eliminar ficheiros' },
      { name: 'usar_media', label: 'Usar multimédia', description: 'Inserir imagens em artigos' },
    ]
  },
  {
    name: 'Páginas',
    icon: Layout,
    capabilities: [
      { name: 'ler_paginas', label: 'Ler páginas', description: 'Visualizar páginas estáticas' },
      { name: 'editar_paginas', label: 'Editar páginas', description: 'Modificar conteúdo de páginas' },
      { name: 'criar_paginas', label: 'Criar páginas', description: 'Adicionar novas páginas' },
      { name: 'eliminar_paginas', label: 'Eliminar páginas', description: 'Remover páginas permanentemente' },
    ]
  },
  {
    name: 'Utilizadores',
    icon: Users,
    capabilities: [
      { name: 'listar_utilizadores', label: 'Listar utilizadores', description: 'Ver todos os utilizadores' },
      { name: 'criar_utilizadores', label: 'Criar utilizadores', description: 'Adicionar novos utilizadores' },
      { name: 'editar_utilizadores', label: 'Editar utilizadores', description: 'Modificar perfis e permissões' },
      { name: 'eliminar_utilizadores', label: 'Eliminar utilizadores', description: 'Remover utilizadores do sistema' },
      { name: 'gerir_permissoes', label: 'Gerir permissões', description: 'Configurar capacidades por papel' },
    ]
  },
  {
    name: 'Configurações',
    icon: Settings,
    capabilities: [
      { name: 'ver_definicoes', label: 'Ver definições', description: 'Aceder às configurações do site' },
      { name: 'editar_definicoes', label: 'Editar definições', description: 'Modificar configurações globais' },
      { name: 'gerir_plugins', label: 'Gerir plugins', description: 'Instalar e configurar extensões' },
      { name: 'gerir_temas', label: 'Gerir temas', description: 'Alterar aparência do site' },
    ]
  },
  {
    name: 'Estatísticas',
    icon: BarChart3,
    capabilities: [
      { name: 'ver_estatisticas', label: 'Ver estatísticas', description: 'Aceder a relatórios de tráfego' },
      { name: 'ver_relatorios', label: 'Ver relatórios', description: 'Gerar e exportar relatórios' },
    ]
  },
  {
    name: 'Sistema',
    icon: Database,
    capabilities: [
      { name: 'acesso_total', label: 'Acesso total', description: 'Permissão de super administrador' },
      { name: 'modo_manutencao', label: 'Modo manutenção', description: 'Ativar/desativar modo manutenção' },
      { name: 'backup_restaurar', label: 'Backup e Restaurar', description: 'Criar e restaurar backups' },
    ]
  }
];

const DEFAULT_CAPABILITIES: Record<string, string[]> = {
  admin: ['acesso_total', 'ler_artigos', 'editar_artigos', 'criar_artigos', 'publicar_artigos', 'eliminar_artigos', 'rever_artigos', 'upload_imagens', 'gerir_biblioteca', 'usar_media', 'ler_paginas', 'editar_paginas', 'criar_paginas', 'eliminar_paginas', 'listar_utilizadores', 'criar_utilizadores', 'editar_utilizadores', 'eliminar_utilizadores', 'gerir_permissoes', 'ver_definicoes', 'editar_definicoes', 'gerir_plugins', 'gerir_temas', 'ver_estatisticas', 'ver_relatorios', 'modo_manutencao', 'backup_restaurar'],
  editor: ['ler_artigos', 'editar_artigos', 'criar_artigos', 'publicar_artigos', 'usar_media', 'ler_paginas', 'editar_paginas', 'rever_artigos'],
  contribuidor: ['ler_artigos', 'criar_artigos', 'usar_media'],
  subscriber: ['ler_artigos'],
  guest: []
};

export default function CapacidadesPage() {
  const [selectedRole, setSelectedRole] = useState('admin');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Artigos']);
  const [capabilities, setCapabilities] = useState(DEFAULT_CAPABILITIES);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    );
  };

  const toggleCapability = (capability: string) => {
    setCapabilities(prev => {
      const roleCaps = prev[selectedRole] || [];
      const newCaps = roleCaps.includes(capability)
        ? roleCaps.filter(c => c !== capability)
        : [...roleCaps, capability];
      return { ...prev, [selectedRole]: newCaps };
    });
  };

  const filteredGroups = CAPABILITY_GROUPS.map(group => ({
    ...group,
    capabilities: group.capabilities.filter(cap => 
      cap.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cap.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.capabilities.length > 0);

  const currentRole = ROLES.find(r => r.id === selectedRole);

  return (
    <div className="p-6 text-[#2c3338] max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1d2327] mb-2">Capacidades do Sistema</h1>
        <p className="text-[#50575e]">
          As capacidades permitem que você altere as permissões para cada função de utilizador.
        </p>
      </div>

      {/* Role Selector */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg p-4 mb-6">
        <label className="block text-sm font-semibold text-[#1d2327] mb-2">Selecionar Papel</label>
        <select 
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full md:w-64 h-10 px-3 border border-[#ccd0d4] rounded-md text-sm focus:border-[#2271b1] focus:outline-none"
        >
          {ROLES.map(role => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
        <p className="text-sm text-[#50575e] mt-2">{currentRole?.description}</p>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#50575e]" />
          <input
            type="text"
            placeholder="Pesquisar capacidades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-[#ccd0d4] rounded-md text-sm focus:border-[#2271b1] focus:outline-none"
          />
        </div>
        <button className="flex items-center gap-2 h-10 px-4 border border-[#ccd0d4] rounded-md text-sm hover:bg-[#f6f7f7]">
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span>Capacidade concedida</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
          <span>Capacidade não concedida</span>
        </div>
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-red-500" />
          <span>Capacidade negada</span>
        </div>
      </div>

      {/* Capability Groups */}
      <div className="space-y-4">
        {filteredGroups.map((group) => {
          const isExpanded = expandedGroups.includes(group.name);
          const Icon = group.icon;
          const groupGranted = group.capabilities.filter(cap => 
            capabilities[selectedRole]?.includes(cap.name)
          ).length;

          return (
            <div key={group.name} className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center justify-between p-4 bg-[#f6f7f7] hover:bg-[#e8e9ea] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#2271b1]" />
                  <span className="font-semibold text-[#1d2327]">{group.name}</span>
                  <span className="text-sm text-[#50575e]">({groupGranted} de {group.capabilities.length})</span>
                </div>
                <ChevronDown className={`w-5 h-5 text-[#50575e] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Group Content */}
              {isExpanded && (
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.capabilities.map((cap) => {
                      const isGranted = capabilities[selectedRole]?.includes(cap.name);
                      return (
                        <div 
                          key={cap.name}
                          onClick={() => toggleCapability(cap.name)}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isGranted 
                              ? 'bg-green-50 border-green-300' 
                              : 'bg-white border-[#ccd0d4] hover:bg-[#f6f7f7]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isGranted ? 'bg-green-500' : 'border-2 border-gray-300'
                          }`}>
                            {isGranted && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <p className={`font-medium text-sm ${isGranted ? 'text-green-800' : 'text-[#1d2327]'}`}>
                              {cap.label}
                            </p>
                            <p className="text-xs text-[#50575e] mt-1">{cap.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#ccd0d4]">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCapabilities({ ...capabilities, [selectedRole]: DEFAULT_CAPABILITIES[selectedRole] })}
            className="flex items-center gap-2 h-10 px-4 text-[#d63638] border border-[#d63638] rounded-md text-sm hover:bg-red-50"
          >
            <RefreshCw className="w-4 h-4" /> Restaurar Padrão
          </button>
          <button 
            onClick={() => setCapabilities({ ...capabilities, [selectedRole]: [] })}
            className="flex items-center gap-2 h-10 px-4 text-[#50575e] border border-[#ccd0d4] rounded-md text-sm hover:bg-[#f6f7f7]"
          >
            <Minus className="w-4 h-4" /> Remover Todas
          </button>
        </div>
        <button 
          onClick={() => {
            // Aqui você implementaria a chamada à API para salvar
            alert(`Capacidades para ${selectedRole} guardadas com sucesso!`);
            console.log('Capacidades a guardar:', capabilities[selectedRole]);
          }}
          className="flex items-center gap-2 h-10 px-6 bg-[#2271b1] text-white rounded-md text-sm font-semibold hover:bg-[#135e96]"
        >
          <Check className="w-4 h-4" /> Guardar Alterações
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-800 text-sm mb-1">Como usar as Capacidades</h4>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Selecione um papel no menu dropdown acima</li>
              <li>Clique em cada grupo para expandir as capacidades</li>
              <li>Clique em uma capacidade para conceder ou remover</li>
              <li>✓ = Capacidade concedida</li>
              <li>□ = Capacidade não concedida</li>
              <li>✕ = Capacidade negada (não pode ser concedida por outra função)</li>
            </ul>
            <a href="#" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2">
              Ver Documentação <ChevronRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
