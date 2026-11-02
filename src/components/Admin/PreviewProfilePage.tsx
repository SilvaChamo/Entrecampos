'use client';

import React, { useState } from 'react';
import { 
  User,
  Mail,
  Shield,
  Save,
  Camera
} from 'lucide-react';

interface PreviewProfilePageProps {
  role: string;
}

export default function PreviewProfilePage({ role }: PreviewProfilePageProps) {
  const [isEditing, setIsEditing] = useState(false);
  
  // Dados baseados na role
  const userData = {
    name: role === 'editor' ? 'João Silva (Editor)' : role === 'contribuidor' ? 'Maria Santos (Contribuidora)' : 'Visitante',
    email: role === 'guest' ? 'visitante@exemplo.com' : `${role}@entrecamposblog.com`,
    role: role.charAt(0).toUpperCase() + role.slice(1),
    joined: '2024-01-15',
    bio: role === 'editor' 
      ? 'Editor responsável pela revisão e publicação de conteúdo.' 
      : role === 'contribuidor'
      ? 'Contribuidor de conteúdo jornalístico.'
      : 'Conta de visitante com acesso limitado.'
  };

  const canEdit = role !== 'guest';

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-normal text-[#1d2327]">Perfil do Utilizador</h1>
        {canEdit && (
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-4 py-2 bg-[#2271b1] text-white rounded-md hover:bg-[#135e96]"
          >
            {isEditing ? 'Cancelar' : 'Editar Perfil'}
          </button>
        )}
      </div>

      <div className="bg-white border border-[#ccd0d4] rounded-lg overflow-hidden">
        {/* Cabeçalho com avatar */}
        <div className="bg-[#f6f7f7] p-6 border-b border-[#ccd0d4]">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-[#2271b1] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {userData.name.charAt(0)}
              </div>
              {canEdit && isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-[#ccd0d4] rounded-full flex items-center justify-center shadow-sm hover:bg-[#f6f7f7]">
                  <Camera className="w-4 h-4 text-[#50575e]" />
                </button>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#1d2327]">{userData.name}</h2>
              <p className="text-[13px] text-[#50575e]">{userData.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-[#00a651] text-white text-[12px] rounded-full">
                {userData.role}
              </span>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                <User className="w-4 h-4 inline mr-1" /> Nome Completo
              </label>
              <input 
                type="text" 
                defaultValue={userData.name}
                disabled={!isEditing}
                className={`w-full h-10 px-3 border border-[#ccd0d4] rounded-md text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
                <Mail className="w-4 h-4 inline mr-1" /> Email
              </label>
              <input 
                type="email" 
                defaultValue={userData.email}
                disabled={!isEditing}
                className={`w-full h-10 px-3 border border-[#ccd0d4] rounded-md text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1d2327] mb-1">
              <Shield className="w-4 h-4 inline mr-1" /> Papel
            </label>
            <input 
              type="text" 
              value={userData.role}
              disabled
              className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md text-sm bg-gray-50"
            />
          </div>

          <div>
            <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Biografia</label>
            <textarea 
              defaultValue={userData.bio}
              disabled={!isEditing}
              rows={3}
              className={`w-full px-3 py-2 border border-[#ccd0d4] rounded-md text-sm ${!isEditing ? 'bg-gray-50' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Membro desde</label>
              <input 
                type="text" 
                value={userData.joined}
                disabled
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-[#1d2327] mb-1">Último acesso</label>
              <input 
                type="text" 
                value="Hoje, 14:30"
                disabled
                className="w-full h-10 px-3 border border-[#ccd0d4] rounded-md text-sm bg-gray-50"
              />
            </div>
          </div>

          {isEditing && (
            <div className="pt-4 border-t border-[#f0f0f1]">
              <button 
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-2 px-4 py-2 bg-[#00a651] text-white rounded-md hover:bg-[#008f45]"
              >
                <Save className="w-4 h-4" /> Guardar Alterações
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Informações adicionais */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 text-sm mb-2">Permissões do {userData.role}</h3>
        <ul className="text-[13px] text-blue-700 space-y-1">
          {role === 'editor' && (
            <>
              <li>• Pode revisar e publicar notícias</li>
              <li>• Acesso à biblioteca multimédia</li>
              <li>• Pode editar o próprio perfil</li>
            </>
          )}
          {role === 'contribuidor' && (
            <>
              <li>• Pode criar e submeter notícias</li>
              <li>• Acesso à biblioteca multimédia</li>
              <li>• Pode editar o próprio perfil</li>
            </>
          )}
          {role === 'guest' && (
            <>
              <li>• Apenas visualização de notícias</li>
              <li>• Sem permissão de edição</li>
              <li>• Acesso limitado ao perfil</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
