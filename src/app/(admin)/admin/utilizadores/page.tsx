'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { SkeletonTableRow } from '@/components/Admin/Skeleton';
import { adminCacheGet, adminCacheSet } from '@/lib/admin-cache';
import AdminSelect from '@/components/Admin/AdminSelect';

interface UserItem {
  id: string;
  username: string;
  name: string;
  email: string;
  role: string;
  articles: number;
  avatar?: string;
  isAdmin?: boolean;
  displayNameType?: string;
  alcunha?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  website?: string;
}

const MOCK_USERS: UserItem[] = [
  { id: '1', username: 'admin', name: 'Silva Chamo', email: 'admin@ecamposmz.com', role: 'Administrador', articles: 76, isAdmin: true },
  { id: '2', username: 'fosterbethune0', name: '—', email: 'costanza@b.fruitingbodymushrooms.online', role: 'Subscritor', articles: 0 },
  { id: '3', username: 'Redacao', name: 'Redação EntreCAMPOS', email: 'silvanochamo@gmail.com', role: 'Actor', articles: 4, avatar: 'https://i.pravatar.cc/150?u=redacao' },
  { id: '4', username: 'Silva', name: 'Silva Chamo', email: 'silva.chamo@gmail.com', role: 'Editor', articles: 0, avatar: 'https://i.pravatar.cc/150?u=silva' },
  { id: '5', username: 'tessakosovich3', name: '—', email: 'tessa.kosovich@williamjons.dynainbox.com', role: 'Subscritor', articles: 0 },
];

const ROLES = ['Administrador', 'Editor', 'Actor', 'Subscritor', 'Contribuidor'];

// Símbolo do EntreCAMPOS para o admin
const EntrecamposSymbol = () => (
  <div className="w-8 h-8 rounded shadow-sm border border-gray-200 flex items-center justify-center bg-[#1d2327] flex-shrink-0">
    <span className="text-[10px] font-black leading-none">
      <span className="text-[#00a651]">EC</span>
    </span>
  </div>
);

export default function UsersAdminPage() {
  const [users, setUsers] = useState<UserItem[]>(() => adminCacheGet<UserItem[]>('users') ?? []);
  const [loading, setLoading] = useState(() => adminCacheGet('users') === undefined);
  const [filter, setFilter] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadUsers = async () => {
    // Já há cópia guardada: mostra-se logo e actualiza-se em segundo plano.
    if (adminCacheGet('users') === undefined) setLoading(true);
    try {
      const res = await fetch('/api/admin/users/list');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      adminCacheSet('users', data.users || []);
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Erro ao carregar utilizadores:', err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesRole = filter === 'Todos' || user.role === filter;
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  const getRoleCount = (role: string) => {
    if (role === 'Todos') return users.length;
    return users.filter(u => u.role === role).length;
  };

  const handleDelete = async (user: UserItem) => {
    if (!confirm(`Tem a certeza que deseja eliminar o utilizador "${user.username}"? Esta acção não pode ser revertida.`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (err: any) {
      alert('Erro ao eliminar utilizador: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleResetPassword = async (user: UserItem) => {
    if (!confirm(`Enviar e-mail de reposição de palavra-passe para "${user.email}"?`)) return;
    try {
      const res = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(data.message);
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  return (
    <div className="ec-page text-[#2c3338]">
      {/* Título, botão de adicionar e, logo a seguir, os filtros (Todos, papéis) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6">
        <h1 className="text-[23px] font-normal text-[#1d2327]">Utilizadores</h1>
        <Link
          href="/admin/utilizadores/novo"
          className="px-3 py-1 bg-white border border-[#00a651] text-[#008f45] rounded-[3px] text-sm hover:bg-[#f6f7f7] transition-all"
        >
          Adicionar utilizador
        </Link>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
          {['Todos', ...ROLES].map((role) => {
            const count = getRoleCount(role);
            if (count === 0 && role !== 'Todos') return null;
            return (
              <button
                key={role}
                onClick={() => setFilter(role)}
                className={`hover:text-[#2271b1] transition-colors ${filter === role ? 'text-black' : 'text-[#2271b1]'}`}
              >
                {role} <span className="text-gray-400">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de ferramentas: no telemóvel cada par (campo + botão) ocupa uma linha, todos com a mesma altura (36px) */}
      <div className="flex flex-col gap-2 mb-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 md:flex md:flex-wrap md:items-center">
          <AdminSelect className="h-9 min-w-0 border-[#ccd0d4] rounded-[3px] text-[13px] bg-white px-2 outline-none focus:border-[#00a651]">
            <option>Acções por lotes</option>
            <option>Eliminar</option>
            <option>Enviar reposição de palavra-passe</option>
          </AdminSelect>
          <button className="h-9 px-3 border border-[#ccd0d4] rounded-[3px] bg-white text-[13px] hover:text-[#00a651]">Aplicar</button>
          <AdminSelect className="h-9 min-w-0 border-[#ccd0d4] rounded-[3px] text-[13px] bg-white px-2 outline-none focus:border-[#00a651] md:ml-2">
            <option>Mudar papel para...</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </AdminSelect>
          <button className="h-9 px-3 border border-[#ccd0d4] rounded-[3px] bg-white text-[13px] hover:text-[#00a651]">Alterar</button>
        </div>
        <div className="flex w-full md:w-auto">
          <input
            type="text"
            placeholder="Pesquisar utilizadores"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 min-w-0 flex-1 pl-3 pr-2 border border-[#ccd0d4] rounded-l-[3px] text-[13px] outline-none focus:border-[#00a651] md:w-56 md:flex-none"
          />
          <button className="h-9 shrink-0 px-3 border border-[#ccd0d4] border-l-0 bg-white text-[13px] text-[#008f45] hover:text-[#00a651] rounded-r-[3px]">
            Pesquisar
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-[#ccd0d4] rounded-[3px] overflow-hidden">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="bg-white text-left font-bold border-b border-[#ccd0d4] text-[#2c3338]">
              <th className="p-3 w-10 text-center"><input type="checkbox" /></th>
              <th className="p-3">Nome de utilizador</th>
              <th className="p-3">Nome</th>
              <th className="p-3">Alcunha</th>
              <th className="p-3">E-mail</th>
              <th className="p-3">Papel</th>
              <th className="p-3 text-center">Artigos</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <SkeletonTableRow columns={7} />
            ) : filteredUsers.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-gray-500">Nenhum utilizador encontrado.</td></tr>
            ) : (
              filteredUsers.map((user, idx) => (
                <tr key={user.id} className={`group border-b border-[#f0f0f1] hover:bg-[#f6f7f7] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f9f9f9]'}`}>
                  <td className="p-3 text-center"><input type="checkbox" /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img src={user.avatar} className="w-10 h-10 rounded-full shadow-sm border border-gray-100 object-cover" alt="" />
                      ) : user.isAdmin ? (
                        <div className="w-10 h-10 rounded-full shadow-sm border border-gray-200 flex items-center justify-center bg-[#1d2327] flex-shrink-0">
                          <span className="text-[12px] font-black leading-none">
                            <span className="text-[#00a651]">EC</span>
                          </span>
                        </div>
                      ) : (
                        <img 
                          src="https://secure.gravatar.com/avatar/ad516503a11cd5ca435acc9bb6523536?s=150&d=mm&r=g" 
                          className="w-10 h-10 rounded-full shadow-sm border border-gray-200 object-cover" 
                          alt="default" 
                        />
                      )}
                      <div className="flex flex-col">
                        <Link href={`/admin/utilizadores/editar/${user.id}`} className="text-[#2271b1] text-[14px] hover:text-[#135e96]">
                          {user.username}
                        </Link>
                        {/* Hover actions (visible on row hover) */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-medium mt-1">
                          <Link href={`/admin/utilizadores/editar/${user.id}`} className="text-[#2271b1] hover:text-[#135e96]">Editar</Link>
                          <span className="text-gray-300">|</span>
                          <Link href={`/admin/utilizadores/ver/${user.id}`} className="text-[#2271b1] hover:text-[#135e96]">Ver</Link>
                          {!user.isAdmin && (
                            <>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={() => handleDelete(user)}
                                disabled={deletingId === user.id}
                                className="text-[#d63638] hover:text-red-700 disabled:opacity-50"
                              >
                                {deletingId === user.id ? 'A eliminar...' : 'Eliminar'}
                              </button>
                            </>
                          )}
                          <span className="text-gray-300">|</span>
                          <button
                            onClick={() => handleResetPassword(user)}
                            className="text-[#2271b1] hover:text-[#135e96]"
                          >
                            Enviar reposição de palavra-passe
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-[#50575e]">{user.name}</td>
                  <td className="p-3 text-[#50575e]">{user.alcunha || '—'}</td>
                  <td className="p-3">
                    <a href={`mailto:${user.email}`} className="text-[#2271b1] hover:underline">{user.email}</a>
                  </td>
                  <td className="p-3 text-[#50575e]">{user.role}</td>
                  <td className="p-3 text-center">
                    <Link href={`/admin/noticias?autor=${user.username}`} className="text-[#2271b1] hover:underline">
                      {user.articles}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && (
        <>
          <div className="mt-4 text-[13px] text-[#50575e]">
            {filteredUsers.length} itens
          </div>
        </>
      )}
    </div>
  );
}
