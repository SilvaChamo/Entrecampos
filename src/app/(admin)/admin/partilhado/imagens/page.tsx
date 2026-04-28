'use client';

import React, { useState } from 'react';
import { FileImage, Download, Trash2, Search, Grid3X3, List, X } from 'lucide-react';

export default function ImagensPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  // Navegar entre imagens
  const navigateImage = (direction: 'prev' | 'next') => {
    const currentIndex = images.findIndex(img => img.imageUrl === viewingImage);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    }
    setViewingImage(images[newIndex].imageUrl);
  };

  // Obter imagem atual
  const getCurrentImage = () => {
    return images.find(img => img.imageUrl === viewingImage);
  };

  const images = [
    { id: 1, title: 'Colheita de Milho', contributor: 'Maria Santos', size: '2.3 MB', dimensions: '1920x1080', date: '2026-04-24', imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=300&fit=crop' },
    { id: 2, title: 'Plantio de Café', contributor: 'João Silva', size: '3.1 MB', dimensions: '2400x1600', date: '2026-04-21', imageUrl: 'https://images.unsplash.com/photo-1511537632536-b7a575805d42?w=400&h=300&fit=crop' },
    { id: 3, title: 'Irrigação por Gotejamento', contributor: 'Carlos Mendes', size: '1.8 MB', dimensions: '1600x900', date: '2026-04-19', imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop' },
    { id: 4, title: 'Festa da Agricultura', contributor: 'Ana Pereira', size: '4.2 MB', dimensions: '3000x2000', date: '2026-04-17', imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop' },
    { id: 5, title: 'Trator no Campo', contributor: 'Pedro Costa', size: '2.8 MB', dimensions: '1920x1080', date: '2026-04-15', imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=300&fit=crop' },
    { id: 6, title: 'Produtos Agrícolas', contributor: 'Maria Santos', size: '1.5 MB', dimensions: '1500x1000', date: '2026-04-12', imageUrl: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=300&fit=crop' },
  ];

  const filteredImages = images.filter(img => 
    img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.contributor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1d2327]">Imagens Partilhadas</h1>
        <p className="text-[#50575e] mt-1">Gerenciar imagens enviadas pelos contribuidores</p>
      </div>

      {/* Search, View Toggle e Paginação */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#50575e]" />
            <input
              type="text"
              placeholder="Pesquisar imagens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
            />
          </div>
          <div className="flex border border-[#ccd0d4] rounded-md overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-[#2271b1] text-white' : 'bg-white text-[#50575e] hover:bg-[#f6f7f7]'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-[#2271b1] text-white' : 'bg-white text-[#50575e] hover:bg-[#f6f7f7]'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Paginação - sempre visível */}
        {(() => {
          const itemsPerPage = 12;
          const totalPages = Math.ceil(filteredImages.length / itemsPerPage) || 1;
          const [currentPage, setCurrentPage] = useState(1);
          
          return (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 text-[#50575e] hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-sm text-[#50575e] min-w-[60px] text-center">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 text-[#50575e] hover:bg-gray-100 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          );
        })()}
      </div>

      {/* Grid de Imagens - Estilo Partilhado */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
          {filteredImages.map(image => (
            <div 
              key={image.id} 
              className="relative group h-[200px] rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setViewingImage(image.imageUrl)}
              style={{
                backgroundImage: image.imageUrl
                  ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${image.imageUrl})` 
                  : `linear-gradient(135deg, #16a34a, #15803d)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {/* Overlay com conteúdo */}
              <div className="absolute inset-0 flex flex-col justify-between p-3">
                {/* Topo - Badge */}
                <div className="flex justify-between items-start">
                  <span className="px-2 py-1 text-xs font-medium rounded shadow-sm bg-green-500/90 text-white">
                    IMG
                  </span>
                  <span className="text-xs text-white/90 font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 px-2 py-0.5 rounded">
                    {image.size}
                  </span>
                </div>

                {/* Baixo - Conteúdo no hover */}
                <div className="flex items-end justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/70 to-transparent -mx-3 -mb-3 p-3 pt-8">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-semibold truncate text-sm" title={image.title}>
                      {image.title}
                    </h4>
                    <p className="text-white/80 text-xs">{image.contributor}</p>
                    <p className="text-white/60 text-xs">{image.dimensions} • {image.date}</p>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
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
      ) : (
        <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-[#50575e] font-medium">Imagem</th>
                <th className="px-4 py-3 text-left text-[#50575e] font-medium">Contribuidor</th>
                <th className="px-4 py-3 text-left text-[#50575e] font-medium">Dimensões</th>
                <th className="px-4 py-3 text-left text-[#50575e] font-medium">Tamanho</th>
                <th className="px-4 py-3 text-right text-[#50575e] font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f1]">
              {filteredImages.map(image => (
                <tr key={image.id} className="hover:bg-[#f6f7f7]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <FileImage className="w-5 h-5 text-[#ccd0d4]" />
                      </div>
                      <span className="font-medium text-[#1d2327]">{image.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#50575e]">{image.contributor}</td>
                  <td className="px-4 py-3 text-[#50575e]">{image.dimensions}</td>
                  <td className="px-4 py-3 text-[#50575e]">{image.size}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredImages.length === 0 && (
        <div className="text-center py-12">
          <FileImage className="w-16 h-16 text-[#ccd0d4] mx-auto mb-4" />
          <p className="text-[#50575e]">Nenhuma imagem encontrada</p>
        </div>
      )}

      {/* Modal de Visualização de Imagem */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative flex items-center justify-center max-w-5xl w-full">
            {/* Imagem - popup com crop para preencher */}
            <div 
              className="relative rounded-xl shadow-2xl overflow-hidden min-w-[800px] min-h-[500px] w-[85vw] h-[75vh] bg-black"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={viewingImage} 
                alt="Visualização" 
                className="w-full h-full object-cover"
              />

              {/* Seta anterior - dentro da imagem */}
              {images.length > 1 && (
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all border border-white/20 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('prev');
                  }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}

              {/* Seta próxima - dentro da imagem */}
              {images.length > 1 && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all border border-white/20 shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateImage('next');
                  }}
                >
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {/* Info sobre o contribuidor - canto inferior esquerdo */}
              <div className="absolute bottom-4 left-4 z-10">
                <p className="text-white/90 text-sm flex items-center gap-2">
                  <span className="text-white/60">Imagem partilhada por:</span>
                  <span className="font-medium">{getCurrentImage()?.contributor}</span>
                </p>
              </div>

              {/* Botão fechar (X) */}
              <button 
                className="absolute top-4 right-4 z-10 p-3 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all"
                onClick={() => setViewingImage(null)}
              >
                <X className="w-6 h-6" />
              </button>

              {/* Botão download - canto inferior direito */}
              <button 
                className="absolute bottom-4 right-4 z-10 p-3 bg-white/90 hover:bg-white text-gray-700 rounded-full shadow-lg transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  alert('Download iniciado');
                }}
                title="Download"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
