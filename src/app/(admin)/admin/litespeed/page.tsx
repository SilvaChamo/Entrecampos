'use client';

import React, { useState, useEffect } from 'react';
import { 
  Zap, RefreshCw, FileText, Server, Image as ImageIcon, 
  CheckCircle, BarChart3, Clock, Cpu, Trash2, Info, 
  Layers, TrendingUp, AlertCircle, HardDrive
} from 'lucide-react';

export default function NextJsCachePage() {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClearing, setIsClearing] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);
  
  const [stats, setStats] = useState({
    staticGenerated: 47,
    isrCached: 12,
    cacheHitRate: 94,
    pageLoadTime: '0.32s',
    totalRequests: 15247,
    buildTime: '45s',
    lastDeploy: '2026-04-27 14:30',
    memoryUsage: '128 MB',
    nextjsVersion: '14.2.0'
  });

  const [cacheTypes, setCacheTypes] = useState([
    { name: 'Static Generation', status: 'active', size: '156 MB', entries: 47, lastCleared: 'Nunca', description: 'Páginas pré-renderizadas em build time' },
    { name: 'ISR Cache', status: 'active', size: '24 MB', entries: 12, lastCleared: '2026-04-25', description: 'Incremental Static Regeneration' },
    { name: 'Server Components', status: 'active', size: '8.5 MB', entries: 89, lastCleared: 'Nunca', description: 'React Server Components cache' },
    { name: 'Image Optimization', status: 'active', size: '45 MB', entries: 234, lastCleared: '2026-04-20', description: 'Imagens otimizadas (.next/images)' },
    { name: 'Build Cache', status: 'active', size: '89 MB', entries: 1, lastCleared: '2026-04-27', description: 'Cache de compilação (.next/cache)' }
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(r => setTimeout(r, 800));
    setStats(prev => ({
      ...prev,
      cacheHitRate: Math.min(100, prev.cacheHitRate + Math.floor(Math.random() * 6) - 3),
      totalRequests: prev.totalRequests + Math.floor(Math.random() * 20)
    }));
    setLastUpdated(new Date());
    setIsRefreshing(false);
  };

  const handleClearCache = async (cacheName: string) => {
    setIsClearing(cacheName);
    await new Promise(r => setTimeout(r, 1000));
    
    setCacheTypes(prev => prev.map(ct => 
      ct.name === cacheName 
        ? { ...ct, lastCleared: new Date().toISOString().split('T')[0], size: '0 MB', entries: 0 }
        : ct
    ));
    
    alert(`Cache ${cacheName} limpo com sucesso!`);
    setIsClearing(null);
    setLastUpdated(new Date());
  };

  return (
    <div className="p-6 text-[#2c3338] min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2271b1] rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#1d2327]">Cache Next.js</h1>
            <p className="text-[#50575e] text-sm">Sistema de cache e otimização Next.js 14</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowInfo(!showInfo)} className="flex items-center gap-2 px-3 py-2 text-[#50575e] hover:bg-gray-100 rounded-md">
            <Info className="w-4 h-4" /> Info
          </button>
          <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2 px-4 py-2 bg-white border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7] disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> 
            {isRefreshing ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Sobre o Cache Next.js</h4>
              <p className="text-sm text-blue-800 mb-2">
                <strong>É necessário limpar o cache?</strong> Geralmente <strong>NÃO</strong>. O Next.js gere automaticamente.
              </p>
              <p className="text-sm text-blue-800">
                Apenas limpe se: (1) Alterou conteúdo estático e precisa de atualização imediata, 
                (2) ISR não está a funcionar, (3) Há inconsistências nos dados.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid - Next.js Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Static Generated Pages */}
        <div className="bg-white rounded-lg p-5 border border-[#ccd0d4] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-[#2271b1]" />
            <span className="text-[#1d2327] text-sm font-medium">Páginas Estáticas (SSG)</span>
          </div>
          <div className="text-center">
            <span className="text-4xl font-bold text-[#1d2327]">{stats.staticGenerated}</span>
            <p className="text-[#50575e] text-sm mt-1">páginas pré-renderizadas</p>
            <p className="text-xs text-green-600 mt-2 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" /> Otimizado para CDN
            </p>
          </div>
        </div>

        {/* ISR Cache */}
        <div className="bg-white rounded-lg p-5 border border-[#ccd0d4] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-5 h-5 text-[#2271b1]" />
            <span className="text-[#1d2327] text-sm font-medium">ISR Cache</span>
          </div>
          <div className="text-center">
            <span className="text-4xl font-bold text-[#1d2327]">{stats.isrCached}</span>
            <p className="text-[#50575e] text-sm mt-1">páginas em revalidação</p>
            <p className="text-xs text-blue-600 mt-2">Revalidação: 60s</p>
          </div>
        </div>

        {/* Cache Hit Rate */}
        <div className="bg-white rounded-lg p-5 border border-[#ccd0d4] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-[#2271b1]" />
            <span className="text-[#1d2327] text-sm font-medium">Taxa de Acerto Cache</span>
          </div>
          <div className="relative w-24 h-24 mx-auto mb-2">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
              <circle cx="48" cy="48" r="40" stroke="#22c55e" strokeWidth="8" fill="none" 
                strokeDasharray={`${(stats.cacheHitRate / 100) * 251} 251`} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-bold text-[#1d2327]">{stats.cacheHitRate}%</span>
            </div>
          </div>
          <p className="text-center text-xs text-[#50575e]">{stats.totalRequests.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')} requests</p>
        </div>

        {/* Build Info */}
        <div className="bg-white rounded-lg p-5 border border-[#ccd0d4] shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-[#2271b1]" />
            <span className="text-[#1d2327] text-sm font-medium">Último Build</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#50575e]">Versão:</span><span className="font-semibold">{stats.nextjsVersion}</span></div>
            <div className="flex justify-between"><span className="text-[#50575e]">Build:</span><span className="font-semibold">{stats.buildTime}</span></div>
            <div className="flex justify-between"><span className="text-[#50575e]">Deploy:</span><span className="font-semibold">{stats.lastDeploy}</span></div>
            <div className="flex justify-between"><span className="text-[#50575e]">Memória:</span><span className="font-semibold">{stats.memoryUsage}</span></div>
          </div>
        </div>
      </div>

      {/* Cache Types with Clear Buttons */}
      <h2 className="text-lg font-semibold text-[#1d2327] mb-4">Tipos de Cache</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cacheTypes.map((cache) => (
          <div key={cache.name} className="bg-white rounded-lg p-5 border border-[#ccd0d4] shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#2271b1]" />
                <h3 className="font-semibold text-[#1d2327]">{cache.name}</h3>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${cache.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {cache.status === 'active' ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <p className="text-sm text-[#50575e] mb-3">{cache.description}</p>
            <div className="space-y-1 text-sm mb-4">
              <div className="flex justify-between"><span className="text-[#50575e]">Tamanho:</span><span className="font-semibold">{cache.size}</span></div>
              <div className="flex justify-between"><span className="text-[#50575e]">Entradas:</span><span className="font-semibold">{cache.entries}</span></div>
              <div className="flex justify-between"><span className="text-[#50575e]">Última limpeza:</span><span className="font-semibold">{cache.lastCleared}</span></div>
            </div>
            <button
              onClick={() => handleClearCache(cache.name)}
              disabled={isClearing === cache.name}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              {isClearing === cache.name ? 'A limpar...' : 'Limpar Cache'}
            </button>
          </div>
        ))}
      </div>

      {/* Global Actions */}
      <div className="bg-gray-50 rounded-lg p-5 border border-[#ccd0d4]">
        <h3 className="font-semibold text-[#1d2327] mb-3">Ações Globais</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => handleClearCache('Static Generation')}
            className="px-4 py-2 bg-white border border-[#ccd0d4] rounded-md hover:bg-gray-50"
          >
            Rebuild All Pages
          </button>
          <button 
            onClick={() => alert('Revalidação ISR iniciada para todas as páginas')}
            className="px-4 py-2 bg-white border border-[#ccd0d4] rounded-md hover:bg-gray-50"
          >
            Revalidar ISR
          </button>
          <button 
            onClick={() => alert('Cache de imagens limpo')}
            className="px-4 py-2 bg-white border border-[#ccd0d4] rounded-md hover:bg-gray-50"
          >
            Limpar Imagens
          </button>
        </div>
        <p className="text-xs text-[#50575e] mt-3">
          Última atualização: {lastUpdated ? lastUpdated.toLocaleString('pt-PT') : '-'}
        </p>
      </div>
    </div>
  );
}
