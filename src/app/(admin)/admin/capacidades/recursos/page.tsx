'use client';

import React, { useState } from 'react';
import { Boxes, Eye, EyeOff, Save, Info } from 'lucide-react';

export default function RecursosPage() {
  const [activeTab, setActiveTab] = useState('admin');

  const roles = [
    { id: 'admin', label: 'Administrador', color: 'bg-purple-500' },
    { id: 'editor', label: 'Editor', color: 'bg-blue-500' },
    { id: 'contribuidor', label: 'Contribuidor', color: 'bg-green-500' },
    { id: 'subscriber', label: 'Subscritor', color: 'bg-yellow-500' },
    { id: 'guest', label: 'Guest', color: 'bg-gray-500' },
  ];

  const [resources, setResources] = useState({
    admin: {
      'Dashboard': true,
      'Notícias - Todas': true,
      'Notícias - Adicionar': true,
      'Notícias - Editar': true,
      'Notícias - Eliminar': true,
      'Notícias - Pendentes': true,
      'Multimédia - Biblioteca': true,
      'Multimédia - Limpeza': true,
      'Utilizadores - Listar': true,
      'Utilizadores - Adicionar': true,
      'Utilizadores - Editar': true,
      'Utilizadores - Eliminar': true,
      'Perfil': true,
      'LiteSpeed Cache': true,
      'Capacidades': true,
      'Visitor Traffic': true,
      'Partilhado': true,
      'Definições': true,
    },
    editor: {
      'Dashboard': false,
      'Notícias - Todas': true,
      'Notícias - Adicionar': true,
      'Notícias - Editar': true,
      'Notícias - Eliminar': false,
      'Notícias - Pendentes': true,
      'Multimédia - Biblioteca': true,
      'Multimédia - Limpeza': false,
      'Utilizadores - Listar': false,
      'Utilizadores - Adicionar': false,
      'Utilizadores - Editar': false,
      'Utilizadores - Eliminar': false,
      'Perfil': true,
      'LiteSpeed Cache': false,
      'Capacidades': false,
      'Visitor Traffic': false,
      'Partilhado': true,
      'Definições': false,
    },
    contribuidor: {
      'Dashboard': false,
      'Notícias - Todas': false,
      'Notícias - Adicionar': true,
      'Notícias - Editar': false,
      'Notícias - Eliminar': false,
      'Notícias - Pendentes': false,
      'Multimédia - Biblioteca': true,
      'Multimédia - Limpeza': false,
      'Utilizadores - Listar': false,
      'Utilizadores - Adicionar': false,
      'Utilizadores - Editar': false,
      'Utilizadores - Eliminar': false,
      'Perfil': true,
      'LiteSpeed Cache': false,
      'Capacidades': false,
      'Visitor Traffic': false,
      'Partilhado': true,
      'Definições': false,
    },
    subscriber: {
      'Dashboard': false,
      'Notícias - Todas': false,
      'Notícias - Adicionar': false,
      'Notícias - Editar': false,
      'Notícias - Eliminar': false,
      'Notícias - Pendentes': false,
      'Multimédia - Biblioteca': false,
      'Multimédia - Limpeza': false,
      'Utilizadores - Listar': false,
      'Utilizadores - Adicionar': false,
      'Utilizadores - Editar': false,
      'Utilizadores - Eliminar': false,
      'Perfil': true,
      'LiteSpeed Cache': false,
      'Capacidades': false,
      'Visitor Traffic': false,
      'Partilhado': false,
      'Definições': false,
    },
    guest: {
      'Dashboard': true,
      'Notícias - Todas': false,
      'Notícias - Adicionar': false,
      'Notícias - Editar': false,
      'Notícias - Eliminar': false,
      'Notícias - Pendentes': false,
      'Multimédia - Biblioteca': false,
      'Multimédia - Limpeza': false,
      'Utilizadores - Listar': false,
      'Utilizadores - Adicionar': false,
      'Utilizadores - Editar': false,
      'Utilizadores - Eliminar': false,
      'Perfil': false,
      'LiteSpeed Cache': false,
      'Capacidades': false,
      'Visitor Traffic': false,
      'Partilhado': false,
      'Definições': false,
    },
  });

  const toggleResource = (resource: string) => {
    setResources(prev => {
      const roleResources = prev[activeTab as keyof typeof prev] as Record<string, boolean>;
      return {
        ...prev,
        [activeTab]: {
          ...roleResources,
          [resource]: !roleResources[resource]
        }
      };
    });
  };

  const currentRole = roles.find(r => r.id === activeTab);
  const currentResources = resources[activeTab as keyof typeof resources];

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Recursos por Papel</h1>
          <p className="text-[#50575e] mt-1">Defina quais recursos cada papel pode visualizar no painel</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Save className="w-4 h-4" /> Guardar Alterações
        </button>
      </div>

      {/* Role Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => setActiveTab(role.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              activeTab === role.id
                ? 'bg-[#2271b1] text-white'
                : 'bg-white border border-[#ccd0d4] text-[#50575e] hover:bg-[#f6f7f7]'
            }`}
          >
            <span className={`w-3 h-3 rounded-full ${role.color}`}></span>
            {role.label}
          </button>
        ))}
      </div>

      {/* Current Role Info */}
      <div className="mb-6 flex items-center gap-3">
        <Boxes className="w-6 h-6 text-[#2271b1]" />
        <div>
          <h2 className="text-lg font-semibold text-[#1d2327]">
            {currentRole?.label}
          </h2>
          <p className="text-sm text-[#50575e]">
            Configurar visibilidade dos recursos para este papel
          </p>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(currentResources).map(([resource, visible]) => (
          <div 
            key={resource}
            onClick={() => toggleResource(resource)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              visible 
                ? 'border-green-300 bg-green-50' 
                : 'border-[#ccd0d4] bg-white hover:bg-[#f6f7f7]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-medium ${visible ? 'text-green-800' : 'text-[#1d2327]'}`}>
                {resource}
              </span>
              {visible ? (
                <Eye className="w-5 h-5 text-green-600" />
              ) : (
                <EyeOff className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <p className="text-xs text-[#50575e] mt-1">
              {visible ? 'Visível na barra lateral' : 'Oculto na barra lateral'}
            </p>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-50 border border-green-300"></div>
          <span className="text-[#50575e]">Visível</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white border border-[#ccd0d4]"></div>
          <span className="text-[#50575e]">Oculto</span>
        </div>
      </div>

      {/* Info */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-yellow-800">Nota importante</h4>
          <p className="text-sm text-yellow-700 mt-1">
            As alterações nesta página afetam imediatamente o que cada utilizador vê na barra lateral do painel de administração. 
            Certifique-se de testar as configurações antes de guardar.
          </p>
        </div>
      </div>
    </div>
  );
}
