'use client';

import React, { useState, useEffect } from 'react';
import { supabase, STORAGE_BUCKET as BUCKET_NAME, SITE_ID } from '@/lib/supabase';
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
  BarChart3,
  UserPlus
} from 'lucide-react';
import { useAuth, UserRole } from '@/context/AuthContext';
import Spinner from '@/components/Common/Spinner';

interface Stats {
  news: number;
  media: number;
  videos: number;
  pending?: number;
  reviewed?: number;
  contributions?: number;
  online?: number;
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
      // Tudo em paralelo: o painel espera pelo pedido mais lento e não pela soma de todos.
      const [countRes, mediaRes, listRes, onlineRes, latestRes] = await Promise.allSettled([
        supabase.from('news').select('*', { count: 'exact', head: true }).eq('site_id', SITE_ID),
        supabase.storage.from(BUCKET_NAME).list('', { limit: 1000 }),
        fetch('/api/admin/news/list', { credentials: 'include' }),
        fetch('/api/admin/users/online', { credentials: 'include' }),
        supabase.from('news').select('id, title, date').eq('site_id', SITE_ID).order('date', { ascending: false }).limit(5),
      ]);

      const mediaFiles = mediaRes.status === 'fulfilled' ? mediaRes.value.data : null;
      const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
      const videoCount = mediaFiles?.filter((f: any) => 
        videoExtensions.some((ext: string) => f.name.toLowerCase().endsWith(ext))
      ).length || 0;

      // Pendentes e total reais: o servidor vê todos os estados (o navegador só vê os publicados).
      let pending = 0;
      let total = (countRes.status === 'fulfilled' && countRes.value.count) || 0;
      if (listRes.status === 'fulfilled' && listRes.value.ok) {
        const items = ((await listRes.value.json()).items ?? []) as { status?: string }[];
        pending = items.filter((n) => String(n.status).toLowerCase() === 'pending').length;
        total = items.length;
      }

      // Utilizadores logados agora (sinal de vida do painel nos últimos minutos).
      let online = 0;
      if (onlineRes.status === 'fulfilled' && onlineRes.value.ok) online = Number((await onlineRes.value.json()).count) || 0;

      setStats({
        news: total,
        media: mediaFiles?.length || 0,
        videos: videoCount,
        pending,
        online,
        reviewed: 12,
        contributions: 5
      });

      const latestNews = latestRes.status === 'fulfilled' ? latestRes.value.data : null;

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
    <div className="ec-page min-h-screen text-[#2c3338] font-sans">
      <section className="bg-white border border-[#ccd0d4] p-4 pb-[30px] mb-4 shadow-sm rounded-none max-md:pb-4">
        <div className="w-full">
          <h1 className="text-[17px] font-[800] text-[#0b5c2e] mb-2 md:text-[20px]">
            Bem-vindo ao painel de administração
          </h1>
          <p className="text-[13px] text-[#50575e] mb-3">
            {role === 'guest' ? 'Junte-se a nós para partilhar as suas notícias e multimedia.' : `Olá, ${user?.name || 'Utilizador'}. Este é o seu painel de gestão.`}
          </p>

          <hr className="border-[#f0f0f1] mb-4" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <h3 className="text-[13px] font-bold mb-3 text-[#0b5c2e] md:text-[14px]">
                {role === 'editor' ? 'Revisão' : role === 'contribuidor' ? 'Produção' : 'Introdução'}
              </h3>
              <Link 
                href={role === 'editor' ? "/admin/noticias/pendentes" : "/admin/noticias/nova"} 
                className="inline-block px-4 py-2 bg-[#00a651] text-white rounded-md text-[13px] hover:bg-[#008f45] transition-all shadow-sm whitespace-nowrap max-md:py-3"
              >
                {role === 'editor' ? 'Revisar notícias pendentes' : 'Escreva o seu primeiro artigo'}
              </Link>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-[#0b5c2e] md:text-[14px]">Próximos passos</h3>
              <ul className="space-y-2 text-[13px] text-[#008f45]">
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
                    <li><Link href="/admin/partilhado" className="flex items-center gap-2 hover:underline"><FileUp className="w-4 h-4 text-gray-400" /> Arquivos partilhados</Link></li>
                    <li className="flex items-center gap-2 hover:underline cursor-pointer"><MessageSquare className="w-4 h-4 text-gray-400" /> Gerir comentários</li>
                  </>
                )}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-[#0b5c2e] md:text-[14px]">Mais acções</h3>
              <ul className="space-y-2 text-[13px] text-[#008f45]">
                <li className="flex items-center gap-2 hover:underline cursor-pointer"><Plus className="w-4 h-4 text-gray-400" /> Adicionar multimédia</li>
                <li className="flex items-center gap-2 hover:underline cursor-pointer"><Video className="w-4 h-4 text-gray-400" /> Gerir vídeos</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-[13px] font-bold text-[#0b5c2e] md:text-[14px]">
                {role === 'guest' ? 'Acesso Limitado' : 'Resumo do Site'}
              </h3>
              <ul className="space-y-2 text-[13px] text-[#008f45]">
                {role === 'editor' ? (
                  <>
                    <li className="flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400" /> Para Revisar <span className="font-bold text-[#ff3333]">{stats.pending}</span></li>
                    <li className="flex items-center gap-2"><CheckSquare className="w-4 h-4 text-gray-400" /> Revistas <span className="font-bold text-[#1d2327]">{stats.reviewed}</span></li>
                  </>
                ) : role === 'contribuidor' ? (
                  <>
                    <li className="flex items-center gap-2"><Newspaper className="w-4 h-4 text-gray-400" /> Minhas Notícias <span className="font-bold text-[#1d2327]">{stats.news}</span></li>
                    <li className="flex items-center gap-2"><FileUp className="w-4 h-4 text-gray-400" /> Contribuições <span className="font-bold text-[#1d2327]">{stats.contributions}</span></li>
                  </>
                ) : role === 'guest' ? (
                  <li className="bg-amber-50 p-2 text-amber-800 text-[12px] border-l-2 border-amber-400">
                    Inscreva-se como Contribuidor para partilhar ficheiros e gerir a sua galeria.
                  </li>
                ) : (
                  <>
                    <li><Link href="/admin/trafego" className="flex items-center gap-2 hover:underline"><BarChart3 className="w-4 h-4 text-gray-400" /> Ver estatísticas</Link></li>
                    <li><Link href="/admin/utilizadores/novo" className="flex items-center gap-2 hover:underline"><UserPlus className="w-4 h-4 text-gray-400" /> Adicionar utilizador</Link></li>
                  </>
                )}
                {(role === 'editor' || role === 'contribuidor') && (
                  <li className="flex items-center gap-2"><Video className="w-4 h-4 text-gray-400" /> Vídeos <span className="font-bold text-[#1d2327]">{stats.videos}</span></li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 items-stretch">
          <div className="h-full">
            <div className="bg-white border border-[#ccd0d4] rounded-md shadow-sm overflow-hidden h-full">
              <div className="p-3 border-b border-[#f0f0f1] bg-white flex items-center justify-between">
                <h2 className="font-bold text-[13px] text-[#0b5c2e] flex items-center gap-2 md:text-[14px]">
                  <Activity className="w-4 h-4 text-gray-400" />
                  Actividades Recentes
                </h2>
              </div>
              <div className="p-4">
                {loading ? (
                  <div className="py-4 text-center"><Spinner size={32} className="mx-auto" /></div>
                ) : recentActivities.length > 0 ? (
                  <ul className="space-y-3">
                    {recentActivities.slice(0, 4).map(activity => (
                      <li key={activity.id} className="border-b border-[#f0f0f1] pb-2 last:border-0 last:pb-0">
                        <p className="text-[13px] text-[#d63638] mb-0.5">{new Date(activity.date).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                        <Link href={`/admin/noticias/editar/${activity.id}`} className="text-[13px] text-[#50575e] font-normal hover:underline">
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

          <div className="flex flex-col h-full gap-3 md:gap-4">
            <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
              <Link href={role === 'editor' ? "/admin/noticias/pendentes" : "/admin/noticias"} className="group h-full">
                <div className="bg-white border border-[#ccd0d4] p-4 rounded-md shadow-sm hover:border-[#00a651] transition-all h-full flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 bg-green-50 text-[#008f45] rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    {role === 'editor' ? <Clock className="w-5 h-5" /> : <Newspaper className="w-5 h-5" />}
                  </div>
                  <span className="text-[18px] font-bold text-[#1d2327] mb-0.5 md:text-[20px]">
                    {role === 'editor' ? stats.pending : stats.news}
                  </span>
                  <span className="text-[11px] text-[#50575e] font-medium uppercase tracking-wider md:text-[12px]">
                    {role === 'editor' ? 'Pendentes' : 'Ver Notícias'}
                  </span>
                </div>
              </Link>

              <Link href={role === 'editor' ? "/admin/noticias/revistas" : role === 'admin' ? "/admin/noticias/pendentes" : "/admin/noticias/nova"} className="group h-full">
                <div className="bg-white border border-[#ccd0d4] p-4 rounded-md shadow-sm hover:border-[#00a651] transition-all h-full flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    {role === 'editor' ? <CheckSquare className="w-5 h-5" /> : role === 'admin' ? <Clock className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <span className="text-[18px] font-bold text-[#1d2327] mb-0.5 md:text-[20px]">
                    {role === 'editor' ? stats.reviewed : role === 'admin' ? stats.pending : '+'}
                  </span>
                  <span className="text-[11px] text-[#50575e] font-medium uppercase tracking-wider md:text-[12px]">
                    {role === 'editor' ? 'Revistas' : role === 'admin' ? 'Pendentes' : 'Nova Notícia'}
                  </span>
                </div>
              </Link>

              <Link href={role === 'admin' ? "/admin/utilizadores" : "/admin/media"} className="group h-full">
                <div className="bg-white border border-[#ccd0d4] p-4 rounded-md shadow-sm hover:border-[#00a651] transition-all h-full flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    {role === 'admin' ? <Users className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
                  </div>
                  <span className="text-[18px] font-bold text-[#1d2327] mb-0.5 md:text-[20px]">
                    {role === 'contribuidor' ? stats.contributions : role === 'admin' ? stats.online : stats.media}
                  </span>
                  <span className="text-[11px] text-[#50575e] font-medium uppercase tracking-wider md:text-[12px]">
                    {role === 'contribuidor' ? 'Contribuições' : role === 'admin' ? 'Utilizadores logados' : 'Galeria'}
                  </span>
                </div>
              </Link>

              <Link href={role === 'guest' ? "/admin/planos" : "/admin/media"} className="group h-full">
                <div className="bg-white border border-[#ccd0d4] p-4 rounded-md shadow-sm hover:border-[#00a651] transition-all h-full flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                    {role === 'guest' ? <CreditCard className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </div>
                  <span className="text-[18px] font-bold text-[#1d2327] mb-0.5 md:text-[20px]">
                    {role === 'guest' ? '$' : stats.videos}
                  </span>
                  <span className="text-[11px] text-[#50575e] font-medium uppercase tracking-wider md:text-[12px]">
                    {role === 'guest' ? 'Planos' : 'Add Video'}
                  </span>
                </div>
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
