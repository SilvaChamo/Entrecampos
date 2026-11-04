-- EntreCAMPOS: estatísticas reais do site (visitas, países, páginas) e contador de leituras das notícias.
-- Correr uma vez no Supabase (SQL Editor). É seguro repetir.

create table if not exists public.site_hits (
  id         bigint generated always as identity primary key,
  site_id    text        not null default 'entrecampos',
  path       text        not null,
  news_slug  text,
  visitor    text        not null,   -- hash diário (IP + navegador + dia): não guarda dados pessoais
  country    text,
  device     text,                   -- desktop | mobile | tablet
  referrer   text,                   -- só o domínio de origem
  created_at timestamptz not null default now()
);

create index if not exists site_hits_site_time_idx on public.site_hits (site_id, created_at desc);
create index if not exists site_hits_site_path_idx on public.site_hits (site_id, path);
create index if not exists site_hits_visitor_slug_idx on public.site_hits (site_id, visitor, news_slug, created_at desc);

-- Só o servidor (service role) escreve e lê; o público não tem acesso.
alter table public.site_hits enable row level security;

-- Soma 1 leitura à notícia (atómico, sem corridas entre visitantes simultâneos).
create or replace function public.increment_news_views(p_slug text, p_site text)
returns void language sql security definer set search_path = public as $$
  update public.news set views = coalesce(views, 0) + 1 where slug = p_slug and site_id = p_site;
$$;
revoke all on function public.increment_news_views(text, text) from public, anon, authenticated;

-- Resumo para o painel, já agregado (fuso de Maputo).
create or replace function public.site_stats(p_site text, p_days int default 30)
returns jsonb language sql stable security definer set search_path = public as $$
  with h as (
    select *, (created_at at time zone 'Africa/Maputo')::date as day
    from public.site_hits
    where site_id = p_site and created_at >= now() - make_interval(days => greatest(p_days, 1))
  )
  select jsonb_build_object(
    'online', (select count(distinct visitor) from public.site_hits where site_id = p_site and created_at >= now() - interval '5 minutes'),
    'today',  (now() at time zone 'Africa/Maputo')::date,
    'daily', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'views', v, 'visitors', u) order by day)
                       from (select day, count(*) v, count(distinct visitor) u from h group by day) d), '[]'::jsonb),
    'pages', coalesce((select jsonb_agg(jsonb_build_object('path', path, 'views', v) order by v desc)
                       from (select path, count(*) v from h group by path order by v desc limit 10) p), '[]'::jsonb),
    'countries', coalesce((select jsonb_agg(jsonb_build_object('country', country, 'views', v) order by v desc)
                       from (select coalesce(country, '??') country, count(*) v from h group by 1 order by v desc limit 10) c), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(jsonb_build_object('device', device, 'views', v) order by v desc)
                       from (select coalesce(device, 'desktop') device, count(*) v from h group by 1) x), '[]'::jsonb),
    'referrers', coalesce((select jsonb_agg(jsonb_build_object('referrer', referrer, 'views', v) order by v desc)
                       from (select referrer, count(*) v from h where referrer is not null and referrer <> '' group by 1 order by v desc limit 10) r), '[]'::jsonb)
  );
$$;
revoke all on function public.site_stats(text, int) from public, anon, authenticated;
