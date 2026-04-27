'use client';

import React, { useState } from 'react';
import { FileImage, Download, Trash2, Search, Grid3X3, List, Eye } from 'lucide-react';

export default function ImagensPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const images = [
    { id: 1, title: 'Colheita de Milho', contributor: 'Maria Santos', size: '2.3 MB', dimensions: '1920x1080', date: '2026-04-24' },
    { id: 2, title: 'Plantio de Café', contributor: 'João Silva', size: '3.1 MB', dimensions: '2400x1600', date: '2026-04-21' },
    { id: 3, title: 'Irrigação por Gotejamento', contributor: 'Carlos Mendes', size: '1.8 MB', dimensions: '1600x900', date: '2026-04-19' },
    { id: 4, title: 'Festa da Agricultura', contributor: 'Ana Pereira', size: '4.2 MB', dimensions: '3000x2000', date: '2026-04-17' },
    { id: 5, title: 'Trator no Campo', contributor: 'Pedro Costa', size: '2.8 MB', dimensions: '1920x1080', date: '2026-04-15' },
    { id: 6, title: 'Produtos Agrícolas', contributor: 'Maria Santos', size: '1.5 MB', dimensions: '1500x1000', date: '2026-04-12' },
  ];

  const filteredImages = images.filter(img => 
    img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    img.contributor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Imagens Partilhadas</h1>
          <p className="text-[#50575e] mt-1">Gerenciar imagens enviadas pelos contribuidores</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <FileImage className="w-4 h-4" /> Adicionar Imagem
        </button>
      </div>

      {/* Search e View Toggle */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
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

      {/* Grid de Imagens */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredImages.map(image => (
            <div key={image.id} className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                <FileImage className="w-12 h-12 text-[#ccd0d4]" />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-[#1d2327] text-sm truncate">{image.title}</h3>
                <p className="text-xs text-[#50575e]">{image.contributor}</p>
                <p className="text-xs text-[#50575e]">{image.size} • {image.dimensions}</p>
                <div className="flex items-center justify-end gap-1 mt-2">
                  <button className="p-1.5 text-[#2271b1] hover:bg-blue-50 rounded" title="Visualizar">
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Eliminar">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                      <button className="p-1.5 text-[#2271b1] hover:bg-blue-50 rounded" title="Visualizar">
                        <Eye className="w-4 h-4" />
                      </button>
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
    </div>
  );
}
