'use client';

import React, { useState } from 'react';
import { LogIn, Save, Plus, Trash2, Edit2, ExternalLink } from 'lucide-react';

export default function RedirecionamentosPage() {
  const [redirects, setRedirects] = useState([
    { id: 1, role: 'editor', afterLogin: '/admin/editor', afterLogout: '/', description: 'Redirecionamento para Editor' },
    { id: 2, role: 'contribuidor', afterLogin: '/admin/contribuidor', afterLogout: '/', description: 'Redirecionamento para Contribuidor' },
    { id: 3, role: 'guest', afterLogin: '/admin/guest', afterLogout: '/login', description: 'Redirecionamento para Guest' },
  ]);

  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ role: '', afterLogin: '', afterLogout: '', description: '' });

  const handleEdit = (redirect: any) => {
    setIsEditing(redirect.id);
    setEditForm({
      role: redirect.role,
      afterLogin: redirect.afterLogin,
      afterLogout: redirect.afterLogout,
      description: redirect.description
    });
  };

  const handleSave = (id: number) => {
    setRedirects(redirects.map(r => r.id === id ? { ...r, ...editForm } : r));
    setIsEditing(null);
  };

  return (
    <div className="p-6 text-[#2c3338]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1d2327]">Redirecionamentos de Login</h1>
          <p className="text-[#50575e] mt-1">Configure para onde cada tipo de utilizador é redirecionado após login/logout</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]">
          <Plus className="w-4 h-4" /> Novo Redirecionamento
        </button>
      </div>

      <div className="space-y-4">
        {redirects.map(redirect => (
          <div key={redirect.id} className="bg-white border border-[#ccd0d4] rounded-lg p-4">
            {isEditing === redirect.id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#1d2327] mb-1">Papel</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                    >
                      <option value="admin">Administrador</option>
                      <option value="editor">Editor</option>
                      <option value="contribuidor">Contribuidor</option>
                      <option value="subscriber">Subscritor</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1d2327] mb-1">Descrição</label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                      className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1d2327] mb-1">Após Login</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.afterLogin}
                        onChange={(e) => setEditForm({...editForm, afterLogin: e.target.value})}
                        className="flex-1 h-10 px-3 border border-[#ccd0d4] rounded-md"
                      />
                      <a 
                        href={editForm.afterLogin} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1d2327] mb-1">Após Logout</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editForm.afterLogout}
                        onChange={(e) => setEditForm({...editForm, afterLogout: e.target.value})}
                        className="flex-1 h-10 px-3 border border-[#ccd0d4] rounded-md"
                      />
                      <a 
                        href={editForm.afterLogout} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7]"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setIsEditing(null)}
                    className="px-4 py-2 border border-[#ccd0d4] rounded-md hover:bg-[#f6f7f7]"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => handleSave(redirect.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]"
                  >
                    <Save className="w-4 h-4" /> Guardar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#2271b1]/10 rounded-lg flex items-center justify-center">
                    <LogIn className="w-5 h-5 text-[#2271b1]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-[#1d2327] capitalize">{redirect.role}</h3>
                      <span className="text-xs text-[#50575e]">• {redirect.description}</span>
                    </div>
                    <div className="text-sm text-[#50575e] mt-1">
                      <span className="text-green-600">Login: {redirect.afterLogin}</span>
                      <span className="mx-2">|</span>
                      <span className="text-orange-600">Logout: {redirect.afterLogout}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleEdit(redirect)}
                    className="p-2 text-[#2271b1] hover:bg-blue-50 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-red-600 hover:bg-red-50 rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">Como funciona?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Após login, o utilizador é redirecionado para a página definida em "Após Login"</li>
          <li>• Após logout, o utilizador é redirecionado para a página definida em "Após Logout"</li>
          <li>• Se não houver redirecionamento definido, usa o padrão do sistema</li>
        </ul>
      </div>
    </div>
  );
}
