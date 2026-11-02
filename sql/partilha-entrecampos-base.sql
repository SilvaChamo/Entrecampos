-- ============================================================
-- Partilha de notícias EntreCAMPOS <-> BasededadosAgro (Supabase self-hosted)
-- Recria, com vistas, a partilha que existia no cloud.
--
--  * EntreCAMPOS -> Base : só as categorias AGRÍCOLAS listadas em category_site_mapping.
--                          Categorias próprias do EntreCAMPOS (comunidade, curiosidade, receitas...)
--                          nunca são partilhadas.
--  * Base -> EntreCAMPOS : tudo o que está activo, EXCEPTO documentos (as categorias novas
--                          passam a existir no EntreCAMPOS).
--
-- Executar como supabase_admin (o papel "postgres" não é dono das tabelas):
--   cat sql/partilha-entrecampos-base.sql | ssh -i ~/.ssh/claude_contabo contabo \
--     "docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1"
-- (servidor Contabo, 169.58.148.144:2234 — é onde está o Supabase em uso, supabase-contabo.visualdesignmoz.com)
-- É idempotente: pode ser corrido mais de uma vez.
-- Não altera nem apaga dados; só cria uma tabela de mapa e duas vistas.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. Mapa: que categorias do EntreCAMPOS aparecem em cada site
--    (lista recuperada do projecto cloud ppgmtxzuaxqshipnvebl)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.category_site_mapping (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category   TEXT    NOT NULL,           -- slug em minúsculas
  site_id    TEXT    NOT NULL,           -- site que PASSA a mostrar a categoria
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (category, site_id)
);

-- Só categorias agrícolas vão para a Base. "comunidade" e "curiosidade" estavam no mapa do cloud mas são
-- específicas do EntreCAMPOS (a Base não tem notícias dessas categorias): ficam de fora.
INSERT INTO public.category_site_mapping (category, site_id) VALUES
  ('agricultura',        'baseagrodata'),
  ('agro-negocio',       'baseagrodata'),
  ('ambiente',           'baseagrodata'),
  ('mulher-agrario',     'baseagrodata'),
  ('turismo-rural',      'baseagrodata'),
  ('sector-agrario',     'baseagrodata'),
  ('fruticultura',       'baseagrodata'),
  ('agropecuaria',       'baseagrodata'),
  ('agro-processamento', 'baseagrodata'),
  ('apicultura',         'baseagrodata'),
  ('seguranca-alimentar','baseagrodata')
ON CONFLICT (category, site_id) DO NOTHING;

DELETE FROM public.category_site_mapping
 WHERE site_id = 'baseagrodata' AND category IN ('comunidade', 'curiosidade');

-- Só o servidor (service_role) gere o mapa
ALTER TABLE public.category_site_mapping ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.category_site_mapping FROM anon, authenticated;
GRANT SELECT ON public.category_site_mapping TO service_role;

-- ------------------------------------------------------------
-- 2. EntreCAMPOS -> Base: vista no schema da Base, com o formato de `articles`
--    A Base lê isto como mais uma fonte de notícias.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW basededados.noticias_entrecampos AS
SELECT
  n.id,
  n.title,
  NULLIF(n.summary, '')                           AS subtitle,
  n.content,
  'Notícia'::text                                 AS type,
  n.slug,
  n.date,
  n.image_url,
  'EntreCAMPOS'::text                             AS source,
  'https://entrecampos.co.mz/noticias/' || n.slug AS source_url,
  n.created_at,
  n.category                                      AS entrecampos_category
FROM public.news n
WHERE n.site_id = 'entrecampos'
  AND lower(n.status) = 'published'
  AND EXISTS (
    SELECT 1
    FROM public.category_site_mapping m
    WHERE m.site_id = 'baseagrodata'
      AND m.is_visible
      AND m.category = lower(replace(trim(n.category), ' ', '-'))
  );

-- ------------------------------------------------------------
-- 3. Base -> EntreCAMPOS: vista no schema public, com o formato de `news`.
--    Tudo o que está activo e publicado, excepto documentos.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.noticias_base AS
SELECT
  a.id,
  a.title,
  COALESCE(a.subtitle, '')                  AS summary,
  a.content,
  -- "Oportunidade" (Base) é a categoria "Oportunidades" que o EntreCAMPOS já tem
  CASE WHEN a.type = 'Oportunidade' THEN 'Oportunidades' ELSE a.type END AS category,
  a.image_url,
  -- articles.date é texto: só as datas AAAA-MM-DD válidas são usadas; as outras ("02 Fev 2024") caem na data de criação
  CASE WHEN a.date ~ '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'
       THEN a.date::date::timestamptz
       ELSE a.created_at END                AS date,
  0                                         AS views,
  a.created_at,
  'baseagrodata'::text                      AS site_id,
  a.slug,
  'published'::text                         AS status,
  a.source_url,
  'Base de Dados Agro'::text                AS author_name,
  a.created_at                              AS updated_at,
  false                                     AS featured
FROM basededados.articles a
WHERE a.deleted_at IS NULL
  AND a.status = 'active'
  AND COALESCE(a.publish_status, '') NOT IN ('draft', 'review')
  AND a.type NOT IN ('document', 'Relatório', 'Legislação', 'PDF', 'Documento', 'Artigo Técnico');

-- ------------------------------------------------------------
-- 4. Leitura pública das duas vistas (só SELECT). As vistas já filtram o que
--    pode ser visto, por isso correm com os direitos do dono (supabase_admin).
-- ------------------------------------------------------------
GRANT SELECT ON basededados.noticias_entrecampos TO anon, authenticated, service_role;
GRANT SELECT ON public.noticias_base              TO anon, authenticated, service_role;

COMMIT;

-- Verificação rápida (esperado: 1.ª ≈ nº de notícias EntreCAMPOS nas 7 categorias;
-- 2.ª = artigos activos da Base que não são documentos):
--   SELECT count(*) FROM basededados.noticias_entrecampos;
--   SELECT count(*) FROM public.noticias_base;
