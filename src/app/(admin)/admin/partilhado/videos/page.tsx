'use client';

import React, { useState } from 'react';
import { FileVideo, Play, Download, Trash2, Search, Filter } from 'lucide-react';

export default function VideosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const videos = [
    { id: 1, title: 'Entrevista com Agricultor Local', contributor: 'João Silva', duration: '5:32', size: '45.2 MB', date: '2026-04-25', thumbnail: '/api/placeholder/320/180' },
    { id: 2, title: 'Festival da Colheita 2026', contributor: 'Ana Pereira', duration: '12:45', size: '120.5 MB', date: '2026-04-22', thumbnail: '/api/placeholder/320/180' },
    { id: 3, title: 'Técnicas de Irrigação', contributor: 'Carlos Mendes', duration: '8:15', size: '78.3 MB', date: '2026-04-20', thumbnail: '/api/placeholder/320/180' },
    { id: 4, title: 'Plantio de Milho - Tutorial', contributor: 'Maria Santos', duration: '15:20', size: '156.7 MB', date: '2026-04-18', thumbnail: '/api/placeholder/320/180' },
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

      {/* Grid de Vídeos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVideos.map(video => (
          <div key={video.id} className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-gray-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="w-12 h-12 text-white opacity-80" />
              </div>
              <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {video.duration}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-medium text-[#1d2327] mb-1 truncate">{video.title}</h3>
              <p className="text-sm text-[#50575e]">Por: {video.contributor}</p>
              <p className="text-xs text-[#50575e]">{video.size} • {video.date}</p>
              
              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-[#f0f0f1]">
                <button className="p-2 text-green-600 hover:bg-green-50 rounded-md" title="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-md" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
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
