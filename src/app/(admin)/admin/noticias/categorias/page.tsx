'use client';

import React, { useState, useEffect } from 'react';
import { Folder, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { SkeletonContent, SkeletonHeader } from '@/components/Admin/Skeleton';

const INITIAL_CATEGORIES = [
  { id: 1, name: 'Agricultura', slug: 'agricultura', count: 45, description: 'Notícias sobre agricultura em geral' },
  { id: 2, name: 'Agro-pecuária', slug: 'agro-pecuaria', count: 23, description: 'Criação de animais e pecuária' },
  { id: 3, name: 'Agro-processamento', slug: 'agro-processamento', count: 12, description: 'Processamento de produtos agrícolas' },
  { id: 4, name: 'Apicultura', slug: 'apicultura', count: 8, description: 'Criação de abelhas e produção de mel' },
  { id: 5, name: 'Segurança Alimentar', slug: 'seguranca-alimentar', count: 15, description: 'Segurança e soberania alimentar' },
  { id: 6, name: 'Agro-negócio', slug: 'agro-negocio', count: 19, description: 'Negócios e empreendedorismo agrícola' },
  { id: 7, name: 'Ambiente', slug: 'ambiente', count: 31, description: 'Meio ambiente e sustentabilidade' },
  { id: 8, name: 'Comunidade', slug: 'comunidade', count: 27, description: 'Notícias da comunidade rural' },
];

export default function CategoriasPage() {
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', slug: '', description: '' });
  const [newForm, setNewForm] = useState({ name: '', slug: '', description: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (category: typeof INITIAL_CATEGORIES[0]) => {
    setIsEditing(category.id);
    setEditForm({ name: category.name, slug: category.slug, description: category.description });
  };

  const handleSave = (id: number) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...editForm } : c));
    setIsEditing(null);
  };

  const handleAdd = () => {
    if (!newForm.name) return;
    const newCategory = {
      id: Date.now(),
      name: newForm.name,
      slug: newForm.slug || newForm.name.toLowerCase().replace(/\s+/g, '-'),
      count: 0,
      description: newForm.description
    };
    setCategories(prev => [...prev, newCategory]);
    setNewForm({ name: '', slug: '', description: '' });
    setIsAdding(false);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar esta categoria?')) return;
    setCategories(prev => prev.filter(c => c.id !== id));
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
              <h1 className="text-2xl font-bold text-[#1d2327]">Categorias</h1>
              <p className="text-[#50575e] mt-1">Gerencie as categorias das notícias</p>
            </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]"
          >
            <Plus className="w-4 h-4" /> Adicionar Categoria
          </button>
        </div>

        {/* Add New Form */}
        {isAdding && (
          <div className="bg-[#f6f7f7] border border-[#ccd0d4] rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-[#1d2327] mb-4">Nova Categoria</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Nome</label>
                <input
                  type="text"
                  value={newForm.name}
                  onChange={(e) => setNewForm({...newForm, name: e.target.value})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                  placeholder="Ex: Agricultura"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Slug</label>
                <input
                  type="text"
                  value={newForm.slug}
                  onChange={(e) => setNewForm({...newForm, slug: e.target.value})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                  placeholder="Ex: agricultura"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1d2327] mb-1">Descrição</label>
                <input
                  type="text"
                  value={newForm.description}
                  onChange={(e) => setNewForm({...newForm, description: e.target.value})}
                  className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                  placeholder="Breve descrição"
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

        {/* Categories Table */}
        <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#f6f7f7] text-left font-bold border-b border-[#ccd0d4]">
                <th className="p-4">Nome</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Descrição</th>
                <th className="p-4 text-center">Artigos</th>
                <th className="p-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-[#f0f0f1] hover:bg-[#f6f7f7]">
                  <td className="p-4">
                    {isEditing === category.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full h-8 px-2 border border-[#ccd0d4] rounded"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-[#2271b1]" />
                        <span className="font-medium text-[#1d2327]">{category.name}</span>
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-[#50575e]">
                    {isEditing === category.id ? (
                      <input
                        type="text"
                        value={editForm.slug}
                        onChange={(e) => setEditForm({...editForm, slug: e.target.value})}
                        className="w-full h-8 px-2 border border-[#ccd0d4] rounded"
                      />
                    ) : (
                      <span className="font-mono text-xs">{category.slug}</span>
                    )}
                  </td>
                  <td className="p-4 text-[#50575e]">
                    {isEditing === category.id ? (
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        className="w-full h-8 px-2 border border-[#ccd0d4] rounded"
                      />
                    ) : (
                      category.description
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2 py-1 bg-[#2271b1]/10 text-[#2271b1] rounded-full text-xs font-semibold">
                      {category.count}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {isEditing === category.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleSave(category.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setIsEditing(null)}
                          className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 hover:opacity-100">
                        <button 
                          onClick={() => handleEdit(category)}
                          className="p-2 text-[#2271b1] hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      <div className="mt-4 text-[13px] text-[#50575e]">
        {categories.length} categorias
      </div>
        </>
      )}
    </div>
  );
}
