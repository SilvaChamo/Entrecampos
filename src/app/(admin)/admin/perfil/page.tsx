'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Edit2, Mail, Globe, FileText } from 'lucide-react';
import Link from 'next/link';

export default function MeuPerfilPage() {
  const { user: authUser } = useAuth();

  if (!authUser) {
    return (
      <div className="p-6 text-[#2c3338]">
        <p>A carregar...</p>
      </div>
    );
  }

  // Usar dados do AuthContext diretamente
  const user = {
    id: authUser.id,
    name: authUser.name || '',
    username: authUser.email?.split('@')[0] || 'user',
    firstName: authUser.name?.split(' ')[0] || '',
    lastName: authUser.name?.split(' ').slice(1).join(' ') || '',
    email: authUser.email || '',
    role: authUser.role || 'Administrador',
    alcunha: '',
    bio: '',
    website: '',
    avatar: null,
    articles: 0
  };

  const fullName = user.name || user.firstName || user.username;

  return (
    <div className="p-4 text-[#2c3338] max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">O seu perfil</h1>
          <p className="text-[13px] text-[#50575e] mt-1">
            <Link href="/admin/utilizadores" className="text-[#2271b1] hover:underline">Utilizadores</Link>
            {' '}&rsaquo; O seu perfil
          </p>
        </div>
        <Link
          href="/admin/utilizadores/editar/me"
          className="flex items-center gap-1.5 h-8 px-4 bg-[#2271b1] text-white text-[13px] font-semibold rounded-[3px] hover:bg-[#135e96] transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" /> Editar perfil
        </Link>
      </div>

      <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden">
        {/* Avatar e nome */}
        <div className="p-6 border-b border-[#ccd0d4] flex items-center gap-5">
          {user.avatar ? (
            <img src={user.avatar} className="w-24 h-24 rounded-full border border-gray-200 object-cover" alt="" />
          ) : (
            <div className="w-24 h-24 rounded-full border border-gray-200 flex items-center justify-center bg-[#1d2327] flex-shrink-0">
              <span className="text-3xl font-black text-[#00a651]">
                {(user.username || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h2 className="text-[18px] font-bold text-[#1d2327]">{fullName}</h2>
            <p className="text-[13px] text-[#50575e]">@{user.username}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-[#f6f7f7] border border-[#ccd0d4] text-[11px] font-semibold rounded-[3px] text-[#50575e]">
              {user.role}
            </span>
          </div>
        </div>

        {/* Detalhes */}
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] w-48 bg-[#f9f9f9]">Nome</th>
              <td className="p-3 text-[13px] text-[#50575e]">{fullName}</td>
            </tr>
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">Nome de utilizador</th>
              <td className="p-3 text-[13px] text-[#50575e]">{user.username}</td>
            </tr>
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">E-mail</th>
              <td className="p-3 text-[13px]">
                <a href={`mailto:${user.email}`} className="text-[#2271b1] hover:underline flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> {user.email}
                </a>
              </td>
            </tr>
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">Alcunha</th>
              <td className="p-3 text-[13px] text-[#50575e]">{user.alcunha || '—'}</td>
            </tr>
            {user.website && (
              <tr className="border-b border-[#f0f0f1]">
                <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">Website</th>
                <td className="p-3 text-[13px]">
                  <a href={user.website} target="_blank" rel="noreferrer" className="text-[#2271b1] hover:underline flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" /> {user.website}
                  </a>
                </td>
              </tr>
            )}
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">Papel</th>
              <td className="p-3 text-[13px] text-[#50575e]">{user.role}</td>
            </tr>
            {user.bio && (
              <tr className="border-b border-[#f0f0f1]">
                <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9] align-top">Biografia</th>
                <td className="p-3 text-[13px] text-[#50575e]">{user.bio}</td>
              </tr>
            )}
            <tr>
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">Artigos publicados</th>
              <td className="p-3 text-[13px]">
                <Link href={`/admin/noticias?autor=${user.username}`} className="text-[#2271b1] hover:underline flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> {user.articles || 0} artigos
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ações */}
      <div className="mt-4 flex items-center gap-3">
        <Link href="/admin/utilizadores/editar/me" className="h-8 px-4 flex items-center bg-[#2271b1] text-white text-[13px] font-semibold rounded-[3px] hover:bg-[#135e96] transition-all">
          Editar perfil
        </Link>
      </div>
    </div>
  );
}
