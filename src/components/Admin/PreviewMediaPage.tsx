'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Grid3X3,
  List,
  MoreVertical,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PreviewMediaPageProps {
  role: string;
}

export default function PreviewMediaPage({ role }: PreviewMediaPageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  
  // Dados simulados - mesmos campos da página real
  const files = [
    { id: 1, name: 'imagem-001.jpg', date: '2024-01-15', size: '2.4 MB', author: 'Admin' },
    { id: 2, name: 'documento.pdf', date: '2024-01-14', size: '1.1 MB', author: 'Editor' },
    { id: 3, name: 'foto-evento.png', date: '2024-01-13', size: '3.2 MB', author: 'Contribuidor' },
    { id: 4, name: 'banner-site.jpg', date: '2024-01-12', size: '1.8 MB', author: 'Admin' },
    { id: 5, name: 'noticia-thumb.jpg', date: '2024-01-11', size: '890 KB', author: 'Editor' },
    { id: 6, name: 'video-intro.mp4', date: '2024-01-10', size: '15.2 MB', author: 'Admin' },
  ];
  
  const canUpload = role !== 'guest';
  const canDelete = role === 'admin' || role === 'editor';
  const canSelect = role !== 'guest';

  return (
    <div className="p-6">
      {/* Header - igual ao /admin/media */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-normal text-[#1d2327]">Biblioteca Multimédia</h1>
          <p className="text-[13px] text-[#50575e]">Gerenciar ficheiros de media</p>
        </div>
        {canUpload && (
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
            <Plus className="w-4 h-4" /> Adicionar Novo
          </button>
        )}
      </div>

      {/* Filtros - igual ao original */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#50575e]" />
            <input
              type="text"
              placeholder="Pesquisar media..."
              className="h-9 pl-10 pr-4 border border-[#ccd0d4] rounded-md text-sm focus:border-[#2271b1] focus:outline-none w-64"
            />
          </div>
          <button className="flex items-center gap-2 h-9 px-3 border border-[#ccd0d4] rounded-md text-sm hover:bg-[#f6f7f7]">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-[#2271b1] text-white' : 'text-[#50575e] hover:bg-[#f6f7f7]'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-[#2271b1] text-white' : 'text-[#50575e] hover:bg-[#f6f7f7]'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ações em massa - só se puder selecionar */}
      {canSelect && selectedFiles.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <span className="text-sm text-blue-700">{selectedFiles.size} ficheiro(s) selecionado(s)</span>
          {canDelete && (
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          )}
        </div>
      )}

      {/* Conteúdo - Grid ou Lista */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {files.map((file) => (
            <div 
              key={file.id}
              className={`relative aspect-square bg-white border rounded cursor-pointer overflow-hidden group ${
                selectedFiles.has(file.id) ? 'ring-2 ring-[#2271b1] border-[#2271b1]' : 'border-[#ccd0d4]'
              }`}
              onClick={() => {
                if (canSelect) {
                  setSelectedFiles(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(file.id)) newSet.delete(file.id);
                    else newSet.add(file.id);
                    return newSet;
                  });
                }
              }}
            >
              {/* Placeholder de imagem */}
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                {file.name.endsWith('.mp4') ? (
                  <span className="text-2xl">🎥</span>
                ) : file.name.endsWith('.pdf') ? (
                  <span className="text-2xl">📄</span>
                ) : (
                  <span className="text-2xl">🖼️</span>
                )}
              </div>
              
              {/* Checkbox de seleção */}
              {canSelect && (
                <div className={`absolute top-2 left-2 w-4 h-4 rounded border flex items-center justify-center ${
                  selectedFiles.has(file.id) ? 'bg-[#2271b1] border-[#2271b1]' : 'bg-white border-gray-400'
                }`}>
                  {selectedFiles.has(file.id) && <Check className="w-3 h-3 text-white" />}
                </div>
              )}
              
              {/* Info no hover */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[11px] truncate">{file.name}</p>
                <p className="text-[10px] text-gray-300">{file.size}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f6f7f7] border-b border-[#ccd0d4]">
              <tr>
                {canSelect && <th className="p-3 w-10"></th>}
                <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Ficheiro</th>
                <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Autor</th>
                <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Data</th>
                <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Tamanho</th>
                <th className="p-3 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                  {canSelect && (
                    <td className="p-3">
                      <div 
                        className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${
                          selectedFiles.has(file.id) ? 'bg-[#2271b1] border-[#2271b1]' : 'bg-white border-gray-400'
                        }`}
                        onClick={() => {
                          setSelectedFiles(prev => {
                            const newSet = new Set(prev);
                            if (newSet.has(file.id)) newSet.delete(file.id);
                            else newSet.add(file.id);
                            return newSet;
                          });
                        }}
                      >
                        {selectedFiles.has(file.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </td>
                  )}
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {file.name.endsWith('.mp4') ? '🎥' : file.name.endsWith('.pdf') ? '📄' : '🖼️'}
                      </span>
                      <span className="text-[13px] text-[#2271b1] hover:underline cursor-pointer">{file.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-[13px] text-[#50575e]">{file.author}</td>
                  <td className="p-3 text-[13px] text-[#50575e]">{file.date}</td>
                  <td className="p-3 text-[13px] text-[#50575e]">{file.size}</td>
                  <td className="p-3">
                    <button className="p-1 hover:bg-[#f0f0f1] rounded">
                      <MoreVertical className="w-4 h-4 text-[#50575e]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Paginação */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-[13px] text-[#50575e]">Mostrando 6 de 6 ficheiros</span>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-[#ccd0d4] rounded hover:bg-[#f6f7f7] disabled:opacity-50" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[13px] text-[#50575e]">Página 1 de 1</span>
          <button className="p-2 border border-[#ccd0d4] rounded hover:bg-[#f6f7f7] disabled:opacity-50" disabled>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
