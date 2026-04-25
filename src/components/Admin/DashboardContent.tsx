'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  Newspaper, 
  ImageIcon, 
  Plus, 
  Activity, 
  Clock, 
  Video, 
  ChevronRight,
  ExternalLink,
  MessageSquare,
  Users,
  CheckSquare,
  FileUp,
  CreditCard,
  Eye
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';

interface Stats {
  news: number;
  media: number;
  videos: number;
  pending?: number;
  reviewed?: number;
  contributions?: number;
}

interface ActivityItem {
  id: string;
  title: string;
  date: string;
  type: 'news' | 'media';
}

export default function DashboardContent({ forcedRole }: { forcedRole?: UserRole }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ news: 0, media: 0, videos: 0, pending: 0, reviewed: 0 });
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { count: newsCount } = await supabase
        .from('news')
        .select('*', { count: 'exact', head: true });

      const BUCKET_NAME = 'news-images';
      const { data: mediaFiles } = await supabase.storage.from(BUCKET_NAME).list('', {
        limit: 1000
      });

      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
      const videoCount = mediaFiles?.filter((f: any) => 
        videoExtensions.some((ext: string) => f.name.toLowerCase().endsWith(ext))
      ).length || 0;

      setStats({
        news: newsCount || 0,
        media: mediaFiles?.length || 0,
        videos: videoCount,
        pending: 3,
        reviewed: 12,
        contributions: 5
      });

      const { data: latestNews } = await supabase
        .from('news')
        .select('id, title, date')
        .order('date', { ascending: false })
        .limit(5);

      const activities: ActivityItem[] = (latestNews || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        date: item.date,
        type: 'news'
      }));

      setRecentActivities(activities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const role = forcedRole || user?.role || 'guest';

  return (
    <div className="bg-[#f0f0f1] min-h-screen text-[#2c3338] font-sans pb-12">
      <section className="bg-white border border-[#ccd0d4] p-6 mb-5 shadow-sm rounded-none">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-[23px] font-normal text-[#1d2327] mb-2">
            {role === 'guest' ? 'Bem-vindo ao EntreCAMPOS' : `Painel de Administração - ${role.toUpperCase()}`}
          </h1>
          <p className="text-[14px] text-[#50575e] mb-4">
            {role === 'guest' ? 'Junte-se a nós para partilhar as suas notícias e multimedia.' : `Bem-vindo, ${user?.name || 'Utilizador'}. Este é o seu painel de gestão.`}
          </p>
          
          <hr className="border-[#f0f0f1] mb-6" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div>
              <h3 className="text-[16px] font-bold mb-3">
                {role === 'editor' ? 'Revisão' : role === 'contribuidor' ? 'Produção' : 'Introdução'}
              </h3>
              <Link 
                href={role === 'editor' ? "/admin/noticias/pendentes" : "/admin/noticias/nova"} 
                className="inline-block px-6 py-2.5 bg-[#00a651] text-white rounded-lg text-[14px] font-bold hover:bg-[#008f45] transition-all shadow-sm mb-4"
              >
                {role === 'editor' ? 'Revisar notícias pendentes' : 'Escreva o seu primeiro artigo'}
              </Link>
              <p className="text-[13px] text-gray-500">
                ou <Link href="/admin/noticias" className="text-[#2271b1] hover:underline">veja todas as notícias</Link>
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-[16px] font-bold">Próximos passos</h3>
              <ul className="space-y-2 text-[13px] text-[#2271b1]">
                {role === 'guest' ? (
                  <>
                    <li className="flex items-center gap-2 hover:underline cursor-pointer"><Users className="w-4 h-4 text-gray-400" /> Registe-se para mais funções</li>
                    <li className="flex items-center gap-2 hover:underline cursor-pointer"><CreditCard className="w-4 h-4 text-gray-400" /> Ver Planos e Preços</li>
                  </>
                ) : role === 'contribuidor' ? (
                  <>
                    <li className="flex items-center gap-2 hover:underline cursor-pointer"><FileUp className="w-4 h-4 text-gray-400" /> Partilhar ficheiros (PDF, Doc)</li>
                    <li className="flex items-center gap-2 hover:underline cursor-pointer"><Activity className="w-4 h-4 text-gray-400" /> Ver as minhas contribuições</li>
                  </>
                ) : (
                  <>
                    {role === 'editor' && <li className="flex items-center gap-2 hover:underline cursor-pointer"><CheckSquare className="w-4 h-4 text-gray-400" /> Ver notícias revistas</li>}
                    <li className="flex items-center gap-2 hover:underline cursor-pointer"><Activity className="w-4 h-4 text-gray-400" /> Ver o seu site</li>
                    <li className="flex items-center gap-2 hover:underline cursor-pointer"><MessageSquare className="w-4 h-4 text-gray-400" /> Gerir comentários</li>
                  </>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-[16px] font-bold">Mais acções</h3>
              <ul className="space-y-2 text-[13px] text-[#2271b1]">
                <li className="flex items-center gap-2 hover:underline cursor-pointer"><Plus className="w-4 h-4 text-gray-400" /> Adicionar multimédia</li>
                <li className="flex items-center gap-2 hover:underline cursor-pointer"><Video className="w-4 h-4 text-gray-400" /> Gerir vídeos</li>
              </ul>
            </div>

            <div className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-[16px] font-bold flex items-center gap-2 text-[#1d2327]">
                <Clock className="w-4 h-4 text-[#00a651]" />
                {role === 'guest' ? 'Acesso Limitado' : 'Resumo do Site'}
              </h3>
              <div className="space-y-2 text-[13px]">
                {role === 'editor' ? (
                  <>
                    <div className="flex items-center justify-between py-1 border-b border-[#f9f9f9]">
                      <span className="text-[#50575e]">Para Revisar</span>
                      <span className="font-bold text-[#d63638]">{stats.pending}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#f9f9f9]">
                      <span className="text-[#50575e]">Revistas</span>
                      <span className="font-bold text-[#1d2327]">{stats.reviewed}</span>
                    </div>
                  </>
                ) : role === 'contribuidor' ? (
                  <>
                    <div className="flex items-center justify-between py-1 border-b border-[#f9f9f9]">
                      <span className="text-[#50575e]">Minhas Notícias</span>
                      <span className="font-bold text-[#1d2327]">{stats.news}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#f9f9f9]">
                      <span className="text-[#50575e]">Contribuições</span>
                      <span className="font-bold text-[#1d2327]">{stats.contributions}</span>
                    </div>
                  </>
                ) : role === 'guest' ? (
                  <div className="bg-amber-50 p-2 text-amber-800 text-[12px] border-l-2 border-amber-400">
                    Inscreva-se como Contribuidor para partilhar ficheiros e gerir a sua galeria.
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between py-1 border-b border-[#f9f9f9]">
                      <span className="text-[#50575e]">Notícias</span>
                      <span className="font-bold text-[#1d2327]">{stats.news}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-[#f9f9f9]">
                      <span className="text-[#50575e]">Multimédia</span>
                      <span className="font-bold text-[#1d2327]">{stats.media}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between py-1 border-b border-[#f9f9f9]">
                  <span className="text-[#50575e]">Vídeos</span>
                  <span className="font-bold text-[#1d2327]">{stats.videos}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 lg:px-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-5">
            <div className="bg-white border border-[#ccd0d4] rounded-[10px] shadow-sm overflow-hidden">
              <div className="p-3 border-b border-[#f0f0f1] bg-white flex items-center justify-between">
                <h2 className="font-bold text-[14px] text-[#1d2327] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  Actividades Recentes
                </h2>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-4 bg-gray-100 rounded w-full"></div>)}
                  </div>
                ) : recentActivities.length > 0 ? (
                  <ul className="space-y-4">
                    {recentActivities.map(activity => (
                      <li key={activity.id} className="border-b border-[#f0f0f1] pb-3 last:border-0 last:pb-0">
                        <p className="text-[13px] text-gray-400 mb-1">{new Date(activity.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                        <Link href={`/admin/noticias/editar/${activity.id}`} className="text-[13px] text-[#2271b1] font-medium hover:underline">
                          {activity.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-gray-500 italic">Nenhuma actividade recente encontrada.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Link href={role === 'editor' ? "/admin/noticias/pendentes" : "/admin/noticias"} className="group">
                <div className="bg-white border border-[#ccd0d4] p-5 rounded-[10px] shadow-sm hover:border-[#2271b1] transition-all h-full flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-blue-50 text-[#2271b1] rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {role === 'editor' ? <Clock className="w-6 h-6" /> : <Newspaper className="w-6 h-6" />}
                  </div>
                  <span className="text-[24px] font-bold text-[#1d2327] mb-1">
                    {role === 'editor' ? stats.pending : stats.news}
                  </span>
                  <span className="text-[13px] text-[#50575e] font-medium uppercase tracking-wider">
                    {role === 'editor' ? 'Pendentes' : 'Ver Notícias'}
                  </span>
                </div>
              </Link>

              <Link href={role === 'editor' ? "/admin/noticias/revistas" : "/admin/noticias/nova"} className="group">
                <div className="bg-white border border-[#ccd0d4] p-5 rounded-[10px] shadow-sm hover:border-[#2271b1] transition-all h-full flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {role === 'editor' ? <CheckSquare className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                  </div>
                  <span className="text-[24px] font-bold text-[#1d2327] mb-1">
                    {role === 'editor' ? stats.reviewed : '+'}
                  </span>
                  <span className="text-[13px] text-[#50575e] font-medium uppercase tracking-wider">
                    {role === 'editor' ? 'Revistas' : 'Nova Notícia'}
                  </span>
                </div>
              </Link>

              <Link href="/admin/media" className="group">
                <div className="bg-white border border-[#ccd0d4] p-5 rounded-[10px] shadow-sm hover:border-[#2271b1] transition-all h-full flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-[24px] font-bold text-[#1d2327] mb-1">
                    {role === 'contribuidor' ? stats.contributions : stats.media}
                  </span>
                  <span className="text-[13px] text-[#50575e] font-medium uppercase tracking-wider">
                    {role === 'contribuidor' ? 'Contribuições' : 'Galeria'}
                  </span>
                </div>
              </Link>

              <Link href={role === 'guest' ? "/admin/planos" : "/admin/media"} className="group">
                <div className="bg-white border border-[#ccd0d4] p-5 rounded-[10px] shadow-sm hover:border-[#2271b1] transition-all h-full flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    {role === 'guest' ? <CreditCard className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                  </div>
                  <span className="text-[24px] font-bold text-[#1d2327] mb-1">
                    {role === 'guest' ? '$' : stats.videos}
                  </span>
                  <span className="text-[13px] text-[#50575e] font-medium uppercase tracking-wider">
                    {role === 'guest' ? 'Planos' : 'Add Video'}
                  </span>
                </div>
              </Link>
            </div>

            <Link 
              href="/" 
              target="_blank"
              className="flex items-center justify-between p-4 bg-[#1d2327] text-white rounded-[10px] hover:bg-[#2c3338] transition-all group"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-white" />
                <span className="text-[14px]">Ver site em directo</span>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
