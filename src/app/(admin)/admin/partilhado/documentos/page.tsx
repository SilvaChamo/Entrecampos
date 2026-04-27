'use client';

import React, { useState } from 'react';
import { FileText, Download, Trash2, Search, File, FileSpreadsheet, FileCode, Eye } from 'lucide-react';

export default function DocumentosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const documents = [
    { id: 1, title: 'Relatório de Produção 2025', contributor: 'Pedro Costa', type: 'pdf', size: '1.8 MB', date: '2026-04-23' },
    { id: 2, title: 'Guia de Práticas Agrícolas', contributor: 'Carlos Mendes', type: 'docx', size: '850 KB', date: '2026-04-20' },
    { id: 3, title: 'Estatísticas de Colheita', contributor: 'Maria Santos', type: 'xlsx', size: '420 KB', date: '2026-04-18' },
    { id: 4, title: 'Manual de Irrigação', contributor: 'João Silva', type: 'pdf', size: '3.2 MB', date: '2026-04-15' },
    { id: 5, title: 'Código de Conduta', contributor: 'Ana Pereira', type: 'docx', size: '520 KB', date: '2026-04-12' },
  ];

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.contributor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <File className="w-8 h-8 text-red-500" />;
      case 'xlsx': return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
      case 'docx': return <FileText className="w-8 h-8 text-blue-500" />;
      default: return <FileCode className="w-8 h-8 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'pdf': return 'PDF';
      case 'xlsx': return 'Excel';
      case 'docx': return 'Word';
      default: return 'Documento';
    }
  };

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Documentos Partilhados</h1>
          <p className="text-[#50575e] mt-1">Gerenciar documentos enviados pelos contribuidores</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <FileText className="w-4 h-4" /> Adicionar Documento
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#50575e]" />
          <input
            type="text"
            placeholder="Pesquisar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-4 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
          />
        </div>
      </div>

      {/* Lista de Documentos */}
      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-[#50575e] font-medium">Documento</th>
              <th className="px-4 py-3 text-left text-[#50575e] font-medium">Tipo</th>
              <th className="px-4 py-3 text-left text-[#50575e] font-medium">Contribuidor</th>
              <th className="px-4 py-3 text-left text-[#50575e] font-medium">Tamanho</th>
              <th className="px-4 py-3 text-left text-[#50575e] font-medium">Data</th>
              <th className="px-4 py-3 text-right text-[#50575e] font-medium">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f0f1]">
            {filteredDocs.map(doc => (
              <tr key={doc.id} className="hover:bg-[#f6f7f7]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {getIcon(doc.type)}
                    <span className="font-medium text-[#1d2327]">{doc.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="px-2 py-1 bg-gray-100 text-[#50575e] text-xs rounded">
                    {getTypeLabel(doc.type)}
                  </span>
                </td>
                <td className="px-4 py-3 text-[#50575e]">{doc.contributor}</td>
                <td className="px-4 py-3 text-[#50575e]">{doc.size}</td>
                <td className="px-4 py-3 text-[#50575e]">{doc.date}</td>
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

      {filteredDocs.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-[#ccd0d4] mx-auto mb-4" />
          <p className="text-[#50575e]">Nenhum documento encontrado</p>
        </div>
      )}
    </div>
  );
}
