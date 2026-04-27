'use client';

import React, { useState } from 'react';
import { Users, Save, UserPlus, Mail } from 'lucide-react';

export default function DefinicoesUtilizadoresPage() {
  const [settings, setSettings] = useState({
    allowRegistration: true,
    requireEmailVerification: true,
    defaultRole: 'subscriber',
    disableInactiveUsers: false,
    sessionTimeout: 60
  });

  return (
    <div className="p-6 text-[#2c3338] w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Definições de Utilizadores</h1>
          <p className="text-[#50575e] mt-1">Configure as opções de registo e acesso</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#2271b1]" /> Registo de Utilizadores
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Permitir novos registos</p>
                <p className="text-sm text-[#50575e]">Utilizadores podem criar contas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.allowRegistration}
                  onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Verificação de email obrigatória</p>
                <p className="text-sm text-[#50575e]">Novos utilizadores devem confirmar email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#2271b1]" /> Configurações de Papel
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Papel Padrão para Novos Registos</label>
              <select
                value={settings.defaultRole}
                onChange={(e) => setSettings({...settings, defaultRole: e.target.value})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              >
                <option value="subscriber">Subscritor</option>
                <option value="contribuidor">Contribuidor</option>
                <option value="editor">Editor</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#2271b1]" /> Segurança de Sessão
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Timeout de Sessão (minutos)</label>
              <input
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              />
              <p className="text-xs text-[#50575e] mt-1">Tempo de inatividade antes de terminar a sessão</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-[#1d2327]">Desativar utilizadores inativos</p>
                <p className="text-sm text-[#50575e]">Desativar contas após 90 dias de inatividade</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={settings.disableInactiveUsers}
                  onChange={(e) => setSettings({...settings, disableInactiveUsers: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
