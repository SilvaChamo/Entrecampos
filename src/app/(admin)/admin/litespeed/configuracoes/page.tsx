'use client';

import React, { useState } from 'react';
import { Save, Settings, AlertCircle } from 'lucide-react';

export default function LiteSpeedConfigPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    pageCache: true,
    imageOptimization: true,
    cssMinify: true,
    jsMinify: true,
    lazyLoad: true,
    gzipCompression: true,
    browserCache: true,
    mobileCache: true,
    loggedInCache: false,
    cacheTime: 604800, // 7 dias em segundos
  });

  const handleSave = async () => {
    setSaving(true);
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    alert('Configurações guardadas com sucesso!');
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Configurações de Cache</h1>
          <p className="text-[#50575e] mt-1">Configure as opções de otimização do LiteSpeed Cache</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#2271b1] text-white rounded-lg font-semibold hover:bg-[#135e96] disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'A guardar...' : 'Guardar Alterações'}
        </button>
      </div>

      {/* Aviso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800">
          Alterar estas configurações afeta diretamente a performance do site. 
          Teste sempre após fazer mudanças significativas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cache Settings */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#2271b1]" /> Cache de Páginas
          </h2>
          
          <div className="space-y-4">
            {[
              { key: 'pageCache', label: 'Ativar cache de páginas', desc: 'Cachear páginas HTML para melhorar velocidade' },
              { key: 'mobileCache', label: 'Cache separado para mobile', desc: 'Criar cache específico para dispositivos móveis' },
              { key: 'loggedInCache', label: 'Cache para utilizadores logados', desc: 'Cachear páginas mesmo para utilizadores autenticados' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1d2327]">{item.label}</p>
                  <p className="text-sm text-[#50575e]">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={() => toggleSetting(item.key as keyof typeof settings)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2271b1]"></div>
                </label>
              </div>
            ))}

            <div className="pt-4 border-t border-[#f0f0f1]">
              <label className="block text-sm font-medium text-[#1d2327] mb-2">
                Tempo de vida do cache
              </label>
              <select 
                value={settings.cacheTime}
                onChange={(e) => setSettings({...settings, cacheTime: parseInt(e.target.value)})}
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
              >
                <option value={3600}>1 hora</option>
                <option value={86400}>1 dia</option>
                <option value={604800}>7 dias</option>
                <option value={2592000}>30 dias</option>
              </select>
            </div>
          </div>
        </div>

        {/* Optimization Settings */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-[#1d2327] mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#2271b1]" /> Otimização
          </h2>
          
          <div className="space-y-4">
            {[
              { key: 'imageOptimization', label: 'Otimização de imagens', desc: 'Comprimir e otimizar imagens automaticamente' },
              { key: 'cssMinify', label: 'Minificar CSS', desc: 'Remover espaços e comentários dos ficheiros CSS' },
              { key: 'jsMinify', label: 'Minificar JavaScript', desc: 'Remover espaços e comentários dos ficheiros JS' },
              { key: 'lazyLoad', label: 'Lazy Load de imagens', desc: 'Carregar imagens apenas quando visíveis' },
              { key: 'gzipCompression', label: 'Compressão Gzip', desc: 'Comprimir conteúdo antes de enviar ao navegador' },
              { key: 'browserCache', label: 'Cache do navegador', desc: 'Utilizar cache local do navegador' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-[#1d2327]">{item.label}</p>
                  <p className="text-sm text-[#50575e]">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings[item.key as keyof typeof settings] as boolean}
                    onChange={() => toggleSetting(item.key as keyof typeof settings)}
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
