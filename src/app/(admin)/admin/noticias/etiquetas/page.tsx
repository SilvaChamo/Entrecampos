'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { SkeletonContent, SkeletonHeader } from '@/components/Admin/Skeleton';

const INITIAL_TAGS = [
  { id: 1, name: 'Milho', slug: 'milho', count: 12 },
  { id: 2, name: 'Soja', slug: 'soja', count: 8 },
  { id: 3, name: 'Algodão', slug: 'algodao', count: 6 },
  { id: 4, name: 'Gado', slug: 'gado', count: 15 },
  { id: 5, name: 'Frango', slug: 'frango', count: 9 },
  { id: 6, name: 'Pecuária', slug: 'pecuaria', count: 22 },
  { id: 7, name: 'Irrigação', slug: 'irrigacao', count: 7 },
  { id: 8, name: 'Semente', slug: 'semente', count: 11 },
  { id: 9, name: 'Adubo', slug: 'adubo', count: 5 },
  { id: 10, name: 'Pragas', slug: 'pragas', count: 14 },
  { id: 11, name: 'Colheita', slug: 'colheita', count: 18 },
  { id: 12, name: 'Mercado', slug: 'mercado', count: 25 },
];

export default function EtiquetasPage() {
  const [tags, setTags] = useState(INITIAL_TAGS);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', slug: '' });
  const [newForm, setNewForm] = useState({ name: '', slug: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredTags = tags.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (tag: typeof INITIAL_TAGS[0]) => {
    setIsEditing(tag.id);
    setEditForm({ name: tag.name, slug: tag.slug });
  };

  const handleSave = (id: number) => {
    setTags(prev => prev.map(t => t.id === id ? { ...t, ...editForm } : t));
    setIsEditing(null);
  };

  const handleAdd = () => {
    if (!newForm.name) return;
    const newTag = {
      id: Date.now(),
      name: newForm.name,
      slug: newForm.slug || newForm.name.toLowerCase().replace(/\s+/g, '-'),
      count: 0
    };
    setTags(prev => [...prev, newTag]);
    setNewForm({ name: '', slug: '' });
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar esta etiqueta?')) return;
    setTags(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="p-6 text-[#2c3338]">
      {loading ? (
        <>
          <SkeletonHeader />
          <SkeletonContent />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[#1d2327]">Etiquetas</h1>
          <p className="text-[#50575e] mt-1">Gerencie as etiquetas para organizar as notícias</p>
        </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]"
          >
            <Plus className="w-4 h-4" /> Adicionar Etiqueta
          </button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Pesquisar etiquetas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 px-3 border border-[#ccd0d4] rounded-md w-full max-w-md"
          />
        </div>

        {/* Add New Form */}
        {isAdding && (
          <div className="bg-[#f6f7f7] border border-[#ccd0d4] rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-[#1d2327] mb-4">Nova Etiqueta</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Nome</label>
                <input
                  type="text"
                  value={newForm.name}
                  onChange={(e) => setNewForm({...newForm, name: e.target.value})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                  placeholder="Ex: Milho"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Slug</label>
                <input
                  type="text"
                  value={newForm.slug}
                  onChange={(e) => setNewForm({...newForm, slug: e.target.value})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                  placeholder="Ex: milho"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={handleAdd}
                className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]"
              >
                <Save className="w-4 h-4" /> Guardar
              </button>
              <button 
                onClick={() => setIsAdding(false)}
                className="flex items-center gap-2 px-4 py-2 border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7]"
              >
                <X className="w-4 h-4" /> Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Tags Cloud/List */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg p-6">
          <div className="flex flex-wrap gap-3">
            {filteredTags.map((tag) => (
              <div 
                key={tag.id} 
                className={`group flex items-center gap-2 px-3 py-2 rounded-full border transition-all ${
                  isEditing === tag.id 
                    ? 'bg-blue-50 border-blue-300' 
                    : 'bg-[#f6f7f7] border-[#ccd0d4] hover:border-[#2271b1]'
                }`}
              >
                {isEditing === tag.id ? (
                  <>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-24 h-7 px-2 text-sm border border-[#ccd0d4] rounded"
                      autoFocus
                    />
                    <button 
                      onClick={() => handleSave(tag.id)}
                      className="p-1 text-green-600 hover:bg-green-100 rounded"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setIsEditing(null)}
                      className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <>
                    <Tag className="w-3 h-3 text-[#2271b1]" />
                    <span className="text-sm font-medium text-[#1d2327]">{tag.name}</span>
                    <span className="text-xs text-[#50575e] bg-white px-1.5 py-0.5 rounded-full">
                      {tag.count}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1 ml-1">
                      <button 
                        onClick={() => handleEdit(tag)}
                        className="p-1 text-[#2271b1] hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => handleDelete(tag.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          {filteredTags.length === 0 && (
            <div className="text-center py-8 text-[#50575e]">
              Nenhuma etiqueta encontrada.
            </div>
          )}
        </div>

      <div className="mt-4 text-[13px] text-[#50575e]">
        {filteredTags.length} de {tags.length} etiquetas
      </div>
        </>
      )}
    </div>
  );
}
