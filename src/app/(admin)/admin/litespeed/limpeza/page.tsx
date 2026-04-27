'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle, Clock, Zap, Globe, Database } from 'lucide-react';

export default function LiteSpeedLimpezaPage() {
  const [isClearing, setIsClearing] = useState(false);
  const [lastCleared, setLastCleared] = useState<string>('2026-04-26 14:30');

  const cacheTypes = [
    { id: 'page', name: 'Cache de Páginas', icon: Globe, items: 1247, size: '45.2 MB' },
    { id: 'image', name: 'Cache de Imagens', icon: Zap, items: 3456, size: '128.5 MB' },
    { id: 'css', name: 'Cache CSS/JS', icon: Database, items: 89, size: '2.1 MB' },
    { id: 'object', name: 'Object Cache', icon: Database, items: 5678, size: '15.8 MB' },
  ];

  const handleClearCache = async (type: string) => {
    setIsClearing(true);
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 800));
    setLastCleared(new Date().toLocaleString('pt-PT'));
    setIsClearing(false);
    alert(`Cache ${type} limpo com sucesso!`);
  };

  const handleClearAll = async () => {
    setIsClearing(true);
    // Simular chamada à API
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLastCleared(new Date().toLocaleString('pt-PT'));
    setIsClearing(false);
    alert('Todo o cache foi limpo com sucesso!');
  };

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d2327]">Limpeza de Cache</h1>
        <p className="text-[#50575e] mt-1">Limpar cache do site para forçar atualização do conteúdo</p>
      </div>

      {/* Alerta */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <h4 className="font-semibold text-yellow-800">Atenção</h4>
          <p className="text-sm text-yellow-700 mt-1">
            Limpar o cache pode afetar temporariamente a performance do site. 
            Os utilizadores podem experimentar tempos de carregamento mais lentos até o cache ser reconstruído.
          </p>
        </div>
      </div>

      {/* Última limpeza */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center gap-3">
        <Clock className="w-5 h-5 text-blue-600" />
        <div>
          <p className="text-sm text-blue-800">
            <span className="font-semibold">Última limpeza:</span> {lastCleared}
          </p>
        </div>
      </div>

      {/* Tipos de Cache */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {cacheTypes.map(cache => (
          <div key={cache.id} className="bg-white border border-[#ccd0d4] rounded-lg p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#2271b1]/10 rounded-lg flex items-center justify-center">
                  <cache.icon className="w-5 h-5 text-[#2271b1]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#1d2327]">{cache.name}</h3>
                  <p className="text-sm text-[#50575e]">{cache.items} itens • {cache.size}</p>
                </div>
              </div>
              <button
                onClick={() => handleClearCache(cache.name)}
                disabled={isClearing}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#ccd0d4] text-[#d63638] rounded-md hover:bg-red-50 text-sm disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" /> Limpar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Limpar Tudo */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1d2327]">Limpar Todo o Cache</h3>
              <p className="text-sm text-[#50575e]">Remove todo o cache do sistema de uma vez</p>
            </div>
          </div>
          <button
            onClick={handleClearAll}
            disabled={isClearing}
            className="flex items-center gap-2 px-6 py-3 bg-[#d63638] text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {isClearing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                A limpar...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" /> Limpar Tudo
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="mt-6 flex items-center gap-2 text-sm text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span>Sistema funcionando normalmente</span>
      </div>
    </div>
  );
}
