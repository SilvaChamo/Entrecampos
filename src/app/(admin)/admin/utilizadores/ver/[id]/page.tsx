'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Globe, Shield, FileText, Edit2, Loader2, Phone, Briefcase, User } from 'lucide-react';

export default function ViewUserPage() {
  const params = useParams();
  const id = params?.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    if (!id) {
      console.log('ID não fornecido');
      return;
    }
    console.log('Carregando utilizador ID:', id);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/get/${id}`);
      const data = await res.json();
      console.log('Resposta API:', data);
      if (!res.ok) throw new Error(data.error);
      setUser(data.user);
    } catch (err: any) {
      console.error('Erro ao carregar:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2271b1] mx-auto mb-2" />
        <p className="text-sm text-gray-500">A carregar perfil...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 text-[#2c3338]">
        <p className="text-red-500">Utilizador não encontrado.</p>
        <Link href="/admin/utilizadores" className="text-[#2271b1] hover:underline mt-2 inline-block">← Voltar aos Utilizadores</Link>
      </div>
    );
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || '—';

  return (
    <div className="p-4 text-[#2c3338] max-w-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[23px] font-normal text-[#1d2327]">Perfil: <strong>{user.username}</strong></h1>
          <p className="text-[13px] text-[#50575e] mt-1">
            <Link href="/admin/utilizadores" className="text-[#2271b1] hover:underline">Utilizadores</Link>
            {' '}&rsaquo; Ver perfil
          </p>
        </div>
        <Link
          href={`/admin/utilizadores/editar/${user.id}`}
          className="flex items-center gap-1.5 h-8 px-4 bg-[#2271b1] text-white text-[13px] font-semibold rounded-md hover:bg-[#135e96] transition-all"
        >
          <Edit2 className="w-3.5 h-3.5" /> Editar utilizador
        </Link>
      </div>

      <div className="bg-white border border-[#ccd0d4] rounded-md overflow-hidden">
        {/* Avatar e nome */}
        <div className="p-6 border-b border-[#ccd0d4] flex items-center gap-5">
          {user.avatar ? (
            <img src={user.avatar} className="w-24 h-24 rounded-full border border-gray-200 object-cover" alt="" />
          ) : user.isAdmin ? (
            <div className="w-24 h-24 rounded-full border border-gray-200 flex items-center justify-center bg-[#1d2327] flex-shrink-0">
              <span className="text-3xl font-black">
                <span className="text-[#00a651]">EC</span>
              </span>
            </div>
          ) : (
            <img 
              src="https://secure.gravatar.com/avatar/ad516503a11cd5ca435acc9bb6523536?s=150&d=mm&r=g" 
              className="w-24 h-24 rounded-full border border-gray-200 object-cover" 
              alt="default" 
            />
          )}
          <div>
            <h2 className="text-[18px] font-bold text-[#1d2327]">{fullName}</h2>
            <p className="text-[13px] text-[#50575e]">@{user.username}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-[#f6f7f7] border border-[#ccd0d4] text-[11px] font-semibold rounded-md text-[#50575e]">
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
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">Telefone</th>
              <td className="p-3 text-[13px] text-[#50575e]">{user.telefone || '—'}</td>
            </tr>
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">Profissão</th>
              <td className="p-3 text-[13px] text-[#50575e]">{user.profissao || '—'}</td>
            </tr>
            <tr className="border-b border-[#f0f0f1]">
              <th className="p-3 text-left text-[13px] font-semibold text-[#1d2327] bg-[#f9f9f9]">Cargo</th>
              <td className="p-3 text-[13px] text-[#50575e]">{user.cargo || '—'}</td>
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
                  <FileText className="w-3.5 h-3.5" /> {user.articles} artigos
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Ações */}
      <div className="mt-4 flex items-center gap-3">
        <Link href={`/admin/utilizadores/editar/${user.id}`} className="h-8 px-4 flex items-center bg-[#2271b1] text-white text-[13px] font-semibold rounded-md hover:bg-[#135e96] transition-all">
          Editar utilizador
        </Link>
        {!user.isAdmin && (
          <button className="h-8 px-4 border border-[#d63638] text-[#d63638] text-[13px] rounded-md hover:bg-red-50 transition-all">
            Eliminar utilizador
          </button>
        )}
      </div>
    </div>
  );
}
