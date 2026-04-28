'use client';

import React, { useState } from 'react';
import { FileVideo, Play, Download, Trash2, Search, Filter, Eye } from 'lucide-react';

export default function VideosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const videos = [
    { id: 1, title: 'Entrevista com Agricultor Local', contributor: 'João Silva', duration: '5:32', size: '45.2 MB', date: '2026-04-25', thumbnail: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=300&fit=crop' },
    { id: 2, title: 'Festival da Colheita 2026', contributor: 'Ana Pereira', duration: '12:45', size: '120.5 MB', date: '2026-04-22', thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop' },
    { id: 3, title: 'Técnicas de Irrigação', contributor: 'Carlos Mendes', duration: '8:15', size: '78.3 MB', date: '2026-04-20', thumbnail: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop' },
    { id: 4, title: 'Plantio de Milho - Tutorial', contributor: 'Maria Santos', duration: '15:20', size: '156.7 MB', date: '2026-04-18', thumbnail: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop' },
  ];

  const filteredVideos = videos.filter(v => 
    v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.contributor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Vídeos Partilhados</h1>
          <p className="text-[#50575e] mt-1">Gerenciar vídeos enviados pelos contribuidores</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <FileVideo className="w-4 h-4" /> Adicionar Vídeo
        </button>
      </div>

      {/* Search e Filter */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#50575e]" />
          <input
            type="text"
            placeholder="Pesquisar vídeos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7]">
          <Filter className="w-4 h-4" /> Filtrar
        </button>
      </div>

      {/* Grid de Vídeos - Estilo Partilhado */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
        {filteredVideos.map(video => (
          <div 
            key={video.id} 
            className="relative group h-[200px] rounded-lg overflow-hidden cursor-pointer"
            style={{
              backgroundImage: video.thumbnail 
                ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${video.thumbnail})` 
                : `linear-gradient(135deg, #dc2626, #991b1b)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            {/* Overlay com conteúdo */}
            <div className="absolute inset-0 flex flex-col justify-between p-3">
              {/* Topo - Badge e duração */}
              <div className="flex justify-between items-start">
                <span className="px-2 py-1 text-xs font-medium rounded shadow-sm bg-red-500/90 text-white">
                  Vídeo
                </span>
                <span className="text-xs text-white/90 font-medium bg-black/50 px-2 py-0.5 rounded">
                  {video.duration}
                </span>
              </div>

              {/* Centro - Play button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-16 h-16 bg-black/40 rounded-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-white" />
                </div>
              </div>

              {/* Baixo - Conteúdo no hover */}
              <div className="flex items-end justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/70 to-transparent -mx-3 -mb-3 p-3 pt-8">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-semibold truncate text-sm" title={video.title}>
                    {video.title}
                  </h4>
                  <p className="text-white/80 text-xs">{video.contributor}</p>
                  <p className="text-white/60 text-xs">{video.size} • {video.date}</p>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button 
                    className="p-1.5 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded text-white transition-colors"
                    title="Visualizar"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Visualizar: ${video.title}`);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-1.5 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded text-white transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    className="p-1.5 bg-red-500/70 hover:bg-red-500/90 backdrop-blur-sm rounded text-white transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <FileVideo className="w-16 h-16 text-[#ccd0d4] mx-auto mb-4" />
          <p className="text-[#50575e]">Nenhum vídeo encontrado</p>
        </div>
      )}
    </div>
  );
}
