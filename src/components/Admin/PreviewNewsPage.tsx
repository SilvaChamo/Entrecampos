'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter,
  Edit2,
  Trash2,
  Eye,
  CheckSquare,
  MoreVertical,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface PreviewNewsPageProps {
  role: string;
}

export default function PreviewNewsPage({ role }: PreviewNewsPageProps) {
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  
  // Dados simulados - filtrados por role
  const allNews = [
    { id: 1, title: 'Moçambique e Itália apostam em inovação agrária', author: 'Admin', date: '20/09/2024', status: 'Publicado', category: 'Economia' },
    { id: 2, title: 'SADC aposta na industrialização', author: 'Editor', date: '18/08/2024', status: role === 'editor' ? 'Pendente' : 'Publicado', category: 'Desenvolvimento' },
    { id: 3, title: 'Inadimplência ameaça fornecimento de água', author: 'Redação', date: '24/07/2024', status: 'Publicado', category: 'Sociedade' },
    { id: 4, title: 'Novas medidas fiscais anunciadas', author: 'Admin', date: '15/07/2024', status: 'Publicado', category: 'Política' },
  ];
  
  // Filtra notícias baseado na role
  const news = role === 'contribuidor' 
    ? allNews.filter(n => n.author === 'Contribuidor' || n.author === 'Redação')
    : allNews;
  
  const canCreate = role !== 'guest';
  const canEdit = role !== 'guest';
  const canDelete = role === 'admin';
  const canPublish = role === 'admin' || role === 'editor';
  const canSelect = role !== 'guest';

  return (
    <div className="p-6">
      {/* Header - igual ao /admin/noticias */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-normal text-[#1d2327]">Todas as Notícias</h1>
          <p className="text-[13px] text-[#50575e]">Gerenciar artigos do site</p>
        </div>
        {canCreate && (
          <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
            <Plus className="w-4 h-4" /> Adicionar Nova
          </button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#50575e]" />
            <input
              type="text"
              placeholder="Pesquisar notícias..."
              className="h-9 pl-10 pr-4 border border-[#ccd0d4] rounded-md text-sm focus:border-[#2271b1] focus:outline-none w-64"
            />
          </div>
          <button className="flex items-center gap-2 h-9 px-3 border border-[#ccd0d4] rounded-md text-sm hover:bg-[#f6f7f7]">
            <Filter className="w-4 h-4" /> Filtrar
          </button>
        </div>
      </div>

      {/* Ações em massa */}
      {canSelect && selectedItems.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
          <span className="text-sm text-blue-700">{selectedItems.size} item(s) selecionado(s)</span>
          {canDelete && (
            <button className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded">
              <Trash2 className="w-4 h-4" /> Eliminar
            </button>
          )}
        </div>
      )}

      {/* Tabela de notícias */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f6f7f7] border-b border-[#ccd0d4]">
            <tr>
              {canSelect && <th className="p-3 w-10"></th>}
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Título</th>
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Autor</th>
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Categoria</th>
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Data</th>
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Estado</th>
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327]">Acções</th>
            </tr>
          </thead>
          <tbody>
            {news.map((item) => (
              <tr key={item.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                {canSelect && (
                  <td className="p-3">
                    <input 
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => {
                        setSelectedItems(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(item.id)) newSet.delete(item.id);
                          else newSet.add(item.id);
                          return newSet;
                        });
                      }}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                  </td>
                )}
                <td className="p-3">
                  <span className="text-[13px] text-[#2271b1] hover:underline cursor-pointer">{item.title}</span>
                </td>
                <td className="p-3 text-[13px] text-[#50575e]">{item.author}</td>
                <td className="p-3 text-[13px] text-[#50575e]">{item.category}</td>
                <td className="p-3 text-[13px] text-[#50575e]">{item.date}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-[11px] font-medium ${
                    item.status === 'Publicado' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button className="p-1.5 hover:bg-[#f0f0f1] rounded" title="Ver">
                      <Eye className="w-4 h-4 text-[#50575e]" />
                    </button>
                    {canEdit && (
                      <button className="p-1.5 hover:bg-[#f0f0f1] rounded" title="Editar">
                        <Edit2 className="w-4 h-4 text-[#2271b1]" />
                      </button>
                    )}
                    {canPublish && item.status === 'Pendente' && (
                      <button className="p-1.5 hover:bg-green-50 rounded" title="Publicar">
                        <CheckSquare className="w-4 h-4 text-green-600" />
                      </button>
                    )}
                    {canDelete && (
                      <button className="p-1.5 hover:bg-red-50 rounded" title="Eliminar">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between mt-4">
        <span className="text-[13px] text-[#50575e]">Mostrando {news.length} de {news.length} itens</span>
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
