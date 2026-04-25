'use client';

import React, { useState } from 'react';
import { useAuth, UserRole } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ChevronRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // For testing, we just log in as admin or mock based on email
      const role: UserRole = formData.email.includes('editor') ? 'editor' : 
                           formData.email.includes('contrib') ? 'contribuidor' : 'admin';
      await login(formData.email, role);
      router.push('/admin');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Erro ao entrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f0f1] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-xl border border-[#ccd0d4] overflow-hidden">
        <div className="bg-[#1d2327] p-8 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">EntreCampos</h1>
          <p className="text-gray-400 text-sm">Bem-vindo de volta!</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="email"
                  placeholder="exemplo@email.com"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#2271b1] focus:border-transparent outline-none transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Palavra-passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#2271b1] focus:border-transparent outline-none transition-all"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2271b1] text-white font-bold hover:bg-[#135e96] transition-all shadow-md flex items-center justify-center gap-2 group disabled:opacity-70"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Entrar no Painel
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-gray-500">
            Ainda não tem conta? <Link href="/register" className="text-[#2271b1] hover:underline font-medium">Registe-se aqui</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
