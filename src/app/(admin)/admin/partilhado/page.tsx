'use client';

import React, { useState } from 'react';
import { 
  FolderOpen, FileVideo, FileImage, FileText, 
  Search, Download, Trash2, Eye, User, Mail, ArrowLeft,
  Folder, ChevronDown, ChevronLeft, X, Calendar, FileType
} from 'lucide-react';

interface SharedItem {
  id: number;
  name: string;
  type: 'video' | 'image' | 'document';
  size: string;
  contributor: string;
  contributorEmail: string;
  date: string;
  description: string;
  isGuest: boolean;
  imageUrl?: string;
}

interface Contributor {
  id: string;
  name: string;
  email: string;
  isGuest: boolean;
  itemCount: number;
}

export default function PartilhadoPage() {
  const [view, setView] = useState<'filters' | 'contributors' | 'content'>('filters');
  const [filterType, setFilterType] = useState<'all' | 'users' | 'emails'>('all');
  const [selectedContributor, setSelectedContributor] = useState<Contributor | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [contentFilter, setContentFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const contributors: Contributor[] = [
    { id: 'user1', name: 'João Silva', email: 'joao@email.com', isGuest: false, itemCount: 5 },
    { id: 'user2', name: 'Maria Santos', email: 'maria@email.com', isGuest: false, itemCount: 3 },
    { id: 'user3', name: 'Pedro Costa', email: 'pedro@email.com', isGuest: false, itemCount: 4 },
    { id: 'user4', name: 'Ana Pereira', email: 'ana@email.com', isGuest: false, itemCount: 2 },
    { id: 'guest1', name: 'Visitante (Email)', email: 'anonimo@email.com', isGuest: true, itemCount: 3 },
  ];

  const sharedItems: SharedItem[] = [
    { id: 1, name: 'Entrevista Agricultor.mp4', type: 'video', size: '45.2 MB', contributor: 'João Silva', contributorEmail: 'joao@email.com', date: '2026-04-25', description: 'Entrevista sobre técnicas de plantio', isGuest: false },
    { id: 2, name: 'Colheita Milho.jpg', type: 'image', size: '2.3 MB', contributor: 'Maria Santos', contributorEmail: 'maria@email.com', date: '2026-04-24', description: 'Fotos da colheita', isGuest: false, imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&h=300&fit=crop' },
    { id: 3, name: 'Relatório Produção.pdf', type: 'document', size: '1.8 MB', contributor: 'Pedro Costa', contributorEmail: 'pedro@email.com', date: '2026-04-23', description: 'Relatório anual 2025', isGuest: false },
    { id: 4, name: 'Festival Colheita.mp4', type: 'video', size: '120.5 MB', contributor: 'Ana Pereira', contributorEmail: 'ana@email.com', date: '2026-04-22', description: 'Vídeo do evento', isGuest: false },
    { id: 5, name: 'Dica Irrigação.jpg', type: 'image', size: '1.5 MB', contributor: 'Visitante (Email)', contributorEmail: 'anonimo@email.com', date: '2026-04-21', description: 'Sistema caseiro partilhado', isGuest: true, imageUrl: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=300&fit=crop' },
    { id: 6, name: 'Compostagem.pdf', type: 'document', size: '2.1 MB', contributor: 'Visitante (Email)', contributorEmail: 'anonimo@email.com', date: '2026-04-20', description: 'Tutorial de compostagem', isGuest: true },
    { id: 7, name: 'Plantio Café.jpg', type: 'image', size: '3.1 MB', contributor: 'João Silva', contributorEmail: 'joao@email.com', date: '2026-04-19', description: 'Processo de plantio', isGuest: false, imageUrl: 'https://images.unsplash.com/photo-1524350876685-274059332603?w=400&h=300&fit=crop' },
    { id: 8, name: 'Pragas.mp4', type: 'video', size: '15.3 MB', contributor: 'Visitante (Email)', contributorEmail: 'anonimo@email.com', date: '2026-04-18', description: 'Identificação de pragas', isGuest: true },
    { id: 9, name: 'Trator no Campo.jpg', type: 'image', size: '2.8 MB', contributor: 'Pedro Costa', contributorEmail: 'pedro@email.com', date: '2026-04-17', description: 'Trator trabalhando', isGuest: false, imageUrl: 'https://images.unsplash.com/photo-1605337709650-5096564952e7?w=400&h=300&fit=crop' },
    { id: 10, name: 'Produtos Agrícolas.jpg', type: 'image', size: '1.9 MB', contributor: 'Maria Santos', contributorEmail: 'maria@email.com', date: '2026-04-16', description: 'Feira de produtos', isGuest: false, imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&h=300&fit=crop' },
    { id: 11, name: 'Irrigação Gotejamento.jpg', type: 'image', size: '2.1 MB', contributor: 'Ana Pereira', contributorEmail: 'ana@email.com', date: '2026-04-15', description: 'Sistema de irrigação', isGuest: false, imageUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=300&fit=crop' },
    { id: 12, name: 'Estufa Vertical.jpg', type: 'image', size: '3.5 MB', contributor: 'João Silva', contributorEmail: 'joao@email.com', date: '2026-04-14', description: 'Agricultura vertical', isGuest: false, imageUrl: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=300&fit=crop' },
  ];

  const filteredContributors = contributors.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.email.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'users') return !c.isGuest && matchesSearch;
    if (filterType === 'emails') return c.isGuest && matchesSearch;
    return matchesSearch;
  });

  const getContributorItems = () => {
    if (!selectedContributor) return [];
    return sharedItems
      .filter(item => item.contributorEmail === selectedContributor.email)
      .filter(item => contentFilter === 'all' || item.type === contentFilter);
  };

  // Obter imagens para navegação baseado na view atual
  const getNavigationImages = () => {
    if (view === 'content' && selectedContributor) {
      // Na página do contribuidor, navegar apenas nas imagens dele
      return sharedItems.filter(
        item => item.contributorEmail === selectedContributor.email && item.type === 'image' && item.imageUrl
      );
    } else {
      // Na página inicial/filtros, navegar em todas as imagens visíveis
      return sharedItems
        .filter(item => item.type === 'image' && item.imageUrl)
        .filter(item => {
          if (filterType === 'users') return !item.isGuest;
          if (filterType === 'emails') return item.isGuest;
          return true;
        })
        .filter(item => {
          if (!searchTerm) return true;
          return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 item.contributor.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }
  };

  // Navegar para imagem anterior/próxima
  const navigateImage = (direction: 'prev' | 'next') => {
    const images = getNavigationImages();
    const currentIndex = images.findIndex(img => img.imageUrl === viewingImage);
    if (currentIndex === -1) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    } else {
      newIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    }
    setViewingImage(images[newIndex].imageUrl || null);
  };

  // Obter nome do contribuidor da imagem atual
  const getCurrentImageContributor = () => {
    const currentImage = sharedItems.find(item => item.imageUrl === viewingImage);
    return currentImage?.contributor || '';
  };

  const handleContributorClick = (contributor: Contributor) => {
    setSelectedContributor(contributor);
    setView('content');
  };

  const handleBack = () => {
    if (view === 'content') {
      setView('contributors');
      setSelectedContributor(null);
    } else if (view === 'contributors') {
      setView('filters');
      setFilterType('all');
    }
  };

  const handleDeleteContributor = (contributor: Contributor, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Eliminar todas as partilhas de ${contributor.name}?`)) {
      alert(`${contributor.name} removido!`);
    }
  };

  const handleArchiveContributor = (contributor: Contributor, e: React.MouseEvent) => {
    e.stopPropagation();
    alert(`${contributor.name} arquivado!`);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <FileVideo className="w-8 h-8 text-red-500" />;
      case 'image': return <FileImage className="w-8 h-8 text-green-500" />;
      case 'document': return <FileText className="w-8 h-8 text-blue-500" />;
      default: return <FolderOpen className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 text-[#2c3338]">
      {/* Header - Alinhado com botão voltar full height */}
      <div className="flex items-stretch gap-3 mb-6">
        {view !== 'filters' && (
          <button 
            onClick={handleBack} 
            className="flex items-center gap-2 px-4 bg-white border border-[#ccd0d4] rounded-lg hover:bg-[#f6f7f7] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#2271b1]" />
            <span className="text-sm text-[#2271b1] font-medium">Voltar</span>
          </button>
        )}
        <div className="flex flex-col justify-center">
          <h1 className="text-2xl font-bold text-[#1d2327] leading-none">
            {view === 'filters' && 'Partilhado'}
            {view === 'contributors' && (filterType === 'emails' ? 'Partilhas por Email' : 'Contribuidores')}
            {view === 'content' && selectedContributor?.name}
          </h1>
          {(view === 'content' || view === 'contributors') && (
            <p className="text-sm text-[#50575e] mt-1">
              {view === 'content' && selectedContributor && (
                selectedContributor.isGuest 
                  ? 'Contribuidor via Email (Visitante)' 
                  : 'Contribuidor Registrado (Utilizador da plataforma)'
              )}
              {view === 'contributors' && 'Lista de todos os contribuidores'}
            </p>
          )}
        </div>
      </div>

      {/* VIEW: Galeria de Todas as Partilhas com Filtro */}
      {view === 'filters' && (
        <>
          {/* Controles: Filtro | Botão | Busca | Paginação */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4 flex-wrap">
                {/* Select Filtro */}
                <div className="relative">
                  <select
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as 'all' | 'users' | 'emails');
                      setCurrentPage(1);
                    }}
                    className="h-10 pl-4 pr-10 border border-[#ccd0d4] rounded-lg focus:border-[#2271b1] focus:outline-none appearance-none bg-white text-[#1d2327] cursor-pointer text-sm"
                  >
                    <option value="all">Todas as Partilhas</option>
                    <option value="users">Apenas Utilizadores</option>
                    <option value="emails">Apenas Emails</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#50575e] pointer-events-none" />
                </div>

                {/* Botão Ver por Utilizador */}
                <button
                  onClick={() => setView('contributors')}
                  className="flex items-center gap-2 h-10 px-4 bg-[#2271b1] text-white rounded-lg hover:bg-[#135e96] transition-colors text-sm"
                >
                  <User className="w-4 h-4" />
                  Ver por Utilizador
                </button>

                {/* Busca */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#50575e]" />
                  <input
                    type="text"
                    placeholder="Pesquisar..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full h-10 pl-9 pr-3 border border-[#ccd0d4] rounded-lg focus:border-[#2271b1] focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Paginação - Lado direito */}
              {(() => {
                const filteredItems = [...sharedItems]
                  .filter(item => {
                    if (filterType === 'users') return !item.isGuest;
                    if (filterType === 'emails') return item.isGuest;
                    return true;
                  })
                  .filter(item => {
                    if (!searchTerm) return true;
                    return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.contributor.toLowerCase().includes(searchTerm.toLowerCase());
                  });
                const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
                
                if (totalPages <= 1) return null;
                
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
          </div>

          {/* Galeria em 3 colunas - Priorizando imagens */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            {[...sharedItems]
              .sort((a, b) => {
                if (a.type === 'image' && b.type !== 'image') return -1;
                if (b.type === 'image' && a.type !== 'image') return 1;
                if (a.type === 'video' && b.type === 'document') return -1;
                if (b.type === 'video' && a.type === 'document') return 1;
                return 0;
              })
              .filter(item => {
                if (filterType === 'users') return !item.isGuest;
                if (filterType === 'emails') return item.isGuest;
                return true;
              })
              .filter(item => {
                if (!searchTerm) return true;
                return item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       item.contributor.toLowerCase().includes(searchTerm.toLowerCase());
              })
              .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
              .map(item => (
                <div 
                  key={item.id} 
                  className="relative group h-[200px] rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (item.type === 'image' && item.imageUrl) {
                      setViewingImage(item.imageUrl);
                    }
                  }}
                  style={{
                    backgroundImage: item.type === 'image' && item.imageUrl
                      ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${item.imageUrl})` 
                      : `linear-gradient(135deg, ${
                          item.type === 'video' ? '#dc2626' : 
                          item.type === 'document' ? '#2563eb' : '#16a34a'
                        }, ${
                          item.type === 'video' ? '#991b1b' : 
                          item.type === 'document' ? '#1d4ed8' : '#15803d'
                        })`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  {/* Overlay com conteúdo */}
                  <div className="absolute inset-0 flex flex-col justify-between p-3">
                    {/* Topo - Badge tipo (sempre visível) */}
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-1 text-xs font-medium rounded shadow-sm ${
                        item.type === 'image' ? 'bg-green-500/90 text-white' :
                        item.type === 'video' ? 'bg-red-500/90 text-white' :
                        'bg-blue-500/90 text-white'
                      }`}>
                        {item.type === 'image' ? 'IMG' : item.type === 'video' ? 'Vídeo' : 'DOC'}
                      </span>
                      {/* Tamanho - oculto por padrão, visível no hover */}
                      <span className="text-xs text-white/90 font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 px-2 py-0.5 rounded">{item.size}</span>
                    </div>

                    {/* Baixo - Conteúdo completo oculto por padrão, visível no hover */}
                    <div className="flex items-end justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/70 to-transparent -mx-3 -mb-3 p-3 pt-8">
                      {/* Info - título e contribuidor à esquerda */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold truncate text-sm" title={item.name}>
                          {item.name}
                        </h4>
                        <p className="text-white/80 text-xs">{item.contributor}</p>
                      </div>

                      {/* Botões de gestão - à direita */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button 
                          className="p-1.5 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded text-white transition-colors"
                          title={item.type === 'image' ? 'Ver Imagem' : 'Visualizar'}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.type === 'image' && item.imageUrl) {
                              setViewingImage(item.imageUrl);
                            } else {
                              alert(`Visualizar: ${item.name}`);
                            }
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className="p-1.5 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded text-white transition-colors"
                          title="Download"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert(`Download: ${item.name}`);
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          className="p-1.5 bg-red-500/90 hover:bg-red-500 backdrop-blur-sm rounded text-white transition-colors"
                          title="Eliminar"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Eliminar ${item.name}?`)) {
                              alert(`${item.name} eliminado`);
                            }
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {sharedItems.filter(item => {
            if (filterType === 'users') return !item.isGuest;
            if (filterType === 'emails') return item.isGuest;
            return true;
          }).length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-[#ccd0d4] mx-auto mb-4" />
              <p className="text-[#50575e]">Nenhum ficheiro encontrado</p>
            </div>
          )}
        </>
      )}

      {/* VIEW: Lista de Contribuidores */}
      {view === 'contributors' && (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#50575e]" />
              <input
                type="text"
                placeholder={`Pesquisar ${filterType === 'emails' ? 'emails' : 'utilizadores'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 border border-[#ccd0d4] rounded-md focus:border-[#2271b1] focus:outline-none"
              />
            </div>
          </div>

          {/* Lista de Contribuidores - 1 coluna, layout horizontal compacto */}
          <div className="space-y-3">
            {filteredContributors.map(contributor => (
              <div 
                key={contributor.id}
                onClick={() => handleContributorClick(contributor)}
                className="bg-white border border-[#ccd0d4] rounded-lg p-3 hover:shadow-md hover:border-[#2271b1] transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    contributor.isGuest ? 'bg-yellow-100' : 'bg-[#2271b1]/10'
                  }`}>
                    {contributor.isGuest ? (
                      <Mail className="w-5 h-5 text-yellow-600" />
                    ) : (
                      <User className="w-5 h-5 text-[#2271b1]" />
                    )}
                  </div>

                  {/* Info principal */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1d2327] text-sm truncate">{contributor.name}</h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        contributor.isGuest ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {contributor.isGuest ? 'Email' : 'User'}
                      </span>
                    </div>
                    <p className="text-xs text-[#50575e] truncate">{contributor.email}</p>
                  </div>

                  {/* Stats */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-[#50575e]">
                      <strong className="text-[#1d2327]">{contributor.itemCount}</strong> ficheiros
                    </p>
                  </div>

                  {/* Botões de ação compactos */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); alert(`Ver: ${contributor.name}`); }}
                      className="p-2 text-[#2271b1] hover:bg-blue-50 rounded-md transition-colors"
                      title="Ver Conteúdo"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleArchiveContributor(contributor, e)}
                      className="p-2 text-[#50575e] hover:bg-gray-100 rounded-md transition-colors"
                      title="Arquivar"
                    >
                      <Folder className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteContributor(contributor, e)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredContributors.length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-[#ccd0d4] mx-auto mb-4" />
              <p className="text-[#50575e]">Nenhum resultado encontrado</p>
            </div>
          )}
        </>
      )}

      {/* VIEW: Conteúdo do Contribuidor - Cards com imagem de fundo */}
      {view === 'content' && selectedContributor && (
        <>
          {/* Info do contribuidor - Estilo Premium */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-blue-200 rounded-xl p-5 mb-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar com imagem real baseada no email */}
                <div className="relative">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(selectedContributor.email)}&backgroundColor=b6e3f4`}
                    alt={selectedContributor.name}
                    className="w-16 h-16 rounded-full border-2 border-white shadow-md bg-white"
                  />
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center ${
                    selectedContributor.isGuest ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {selectedContributor.isGuest ? (
                      <Mail className="w-3 h-3 text-white" />
                    ) : (
                      <User className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[#1d2327] text-lg">{selectedContributor.email}</p>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                      selectedContributor.isGuest 
                        ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' 
                        : 'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {selectedContributor.isGuest ? 'Visitante' : 'Registrado'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-[#50575e]">
                    <span className="flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-[#2271b1]" />
                      <strong className="text-[#1d2327]">{getContributorItems().length}</strong> ficheiros partilhados
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#2271b1]" />
                      Membro desde <strong className="text-[#1d2327]">2026</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Filtro de tipo de conteúdo - Select */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#50575e]">Filtrar:</span>
                <select
                  value={contentFilter}
                  onChange={(e) => setContentFilter(e.target.value as 'all' | 'image' | 'video' | 'document')}
                  className="h-9 px-3 pr-8 border border-[#ccd0d4] rounded-lg bg-white text-sm text-[#2c3338] focus:border-[#2271b1] focus:outline-none cursor-pointer"
                >
                  <option value="all">Todos os ficheiros</option>
                  <option value="image">Imagens</option>
                  <option value="video">Vídeos</option>
                  <option value="document">Documentos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Grid de Cards de Mídia - 3 colunas com imagem de fundo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {getContributorItems().map((item) => (
              <div 
                key={item.id} 
                className="relative group h-[200px] rounded-lg overflow-hidden cursor-pointer"
                onClick={() => {
                  if (item.type === 'image' && item.imageUrl) {
                    setViewingImage(item.imageUrl);
                  }
                }}
                style={{
                  backgroundImage: item.type === 'image' && item.imageUrl
                    ? `linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url(${item.imageUrl})` 
                    : `linear-gradient(135deg, ${
                        item.type === 'video' ? '#dc2626' : 
                        item.type === 'document' ? '#2563eb' : '#16a34a'
                      }, ${
                        item.type === 'video' ? '#991b1b' : 
                        item.type === 'document' ? '#1d4ed8' : '#15803d'
                      })`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Overlay com conteúdo */}
                <div className="absolute inset-0 flex flex-col justify-between p-3">
                  {/* Topo - Badge tipo (sempre visível) */}
                  <div className="flex justify-between items-start">
                    <span className={`px-2 py-1 text-xs font-medium rounded shadow-sm ${
                      item.type === 'video' ? 'bg-red-500/90 text-white' :
                      item.type === 'image' ? 'bg-green-500/90 text-white' :
                      'bg-blue-500/90 text-white'
                    }`}>
                      {item.type === 'video' ? 'Vídeo' : item.type === 'image' ? 'Imagem' : 'Documento'}
                    </span>
                    {/* Tamanho - oculto por padrão, visível no hover */}
                    <span className="text-xs text-white/90 font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 px-2 py-0.5 rounded">{item.size}</span>
                  </div>

                  {/* Baixo - Conteúdo completo oculto por padrão, visível no hover */}
                  <div className="flex items-end justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-t from-black/70 to-transparent -mx-3 -mb-3 p-3 pt-8">
                    {/* Info - título, tipo e data à esquerda */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-semibold truncate text-sm" title={item.name}>
                        {item.name}
                      </h4>
                      <div className="flex items-center gap-2 text-white/70 text-xs mt-0.5">
                        <span className="flex items-center gap-1">
                          <FileType className="w-3 h-3" />
                          {item.type === 'video' ? 'Vídeo' : item.type === 'image' ? 'Imagem' : 'Documento'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {item.date}
                        </span>
                      </div>
                    </div>

                    {/* Botões de gestão - à direita */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button 
                        className="p-1.5 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded text-white transition-colors"
                        title={item.type === 'image' ? 'Ver Imagem' : 'Visualizar'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.type === 'image' && item.imageUrl) {
                            setViewingImage(item.imageUrl);
                          } else {
                            alert(`Visualizar: ${item.name}`);
                          }
                        }}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="p-1.5 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded text-white transition-colors"
                        title="Download"
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`Download: ${item.name}`);
                        }}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        className="p-1.5 bg-red-500/90 hover:bg-red-500 backdrop-blur-sm rounded text-white transition-colors"
                        title="Eliminar"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Eliminar ${item.name}?`)) {
                            alert(`${item.name} eliminado`);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {getContributorItems().length === 0 && (
            <div className="text-center py-12">
              <FolderOpen className="w-16 h-16 text-[#ccd0d4] mx-auto mb-4" />
              <p className="text-[#50575e]">Este contribuidor ainda não partilhou conteúdo</p>
            </div>
          )}
        </>
      )}

      {/* Modal Simples de Visualização de Imagem */}
      {viewingImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setViewingImage(null)}
        >
          {/* Container da imagem com controles */}
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
              {getNavigationImages().length > 1 && (
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
              {getNavigationImages().length > 1 && (
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
                  <span className="font-medium">{getCurrentImageContributor()}</span>
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
