'use client';

import React, { useState } from 'react';
import { Newspaper, Save, Settings } from 'lucide-react';

export default function DefinicoesNoticiasPage() {
  const [settings, setSettings] = useState({
    postsPerPage: 10,
    defaultCategory: 'Agricultura',
    enableComments: true,
    moderateComments: true,
    autoPublish: false,
    notifyOnNewPost: true
  });

  return (
    <div className="p-6 text-[#2c3338] w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Definições de Notícias</h1>
          <p className="text-[#50575e] mt-1">Configure as opções de publicação de notícias</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Save className="w-4 h-4" /> Guardar
        </button>
      </div>

      <div className="space-y-6">
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-[#2271b1]" /> Configurações de Publicação
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Notícias por Página</label>
              <input
                type="number"
                value={settings.postsPerPage}
                onChange={(e) => setSettings({...settings, postsPerPage: parseInt(e.target.value)})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#1d2327] mb-1">Categoria Padrão</label>
              <select
                value={settings.defaultCategory}
                onChange={(e) => setSettings({...settings, defaultCategory: e.target.value})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              >
                <option>Agricultura</option>
                <option>Comunidade</option>
                <option>Ambiente</option>
                <option>Agro-negócio</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#2271b1]" /> Opções de Moderação
          </h2>
          
          <div className="space-y-4">
            {[
              { key: 'enableComments', label: 'Ativar comentários', desc: 'Permitir comentários nas notícias' },
              { key: 'moderateComments', label: 'Moderar comentários', desc: 'Comentários aguardam aprovação' },
              { key: 'autoPublish', label: 'Publicação automática', desc: 'Publicar imediatamente sem revisão' },
              { key: 'notifyOnNewPost', label: 'Notificar novas notícias', desc: 'Enviar email quando houver nova notícia' }
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1d2327]">{item.label}</p>
                  <p className="text-sm text-[#50575e]">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={(e) => setSettings({...settings, [item.key]: e.target.checked})}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
