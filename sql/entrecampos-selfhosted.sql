-- ============================================================
-- ENTRECAMPOS — schema no Supabase self-hosted
-- (supabase.visualdesignmoz.com)
-- Executar no SQL Editor do Studio OU via scripts/setup-selfhosted.js
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- Sites partilhados nesta instância (entrecampos, baseagrodata, …)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  domain TEXT,
  logo_url TEXT,
  storage_bucket TEXT NOT NULL DEFAULT 'entrecampos-media',
  storage_driver TEXT NOT NULL DEFAULT 'supabase'
    CHECK (storage_driver IN ('supabase', 'hetzner_s3')),
  s3_public_base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.sites (id, name, domain, storage_bucket, storage_driver)
VALUES
  ('entrecampos', 'EntreCAMPOS', 'entrecampos.co.mz', 'entrecampos-media', 'supabase'),
  ('baseagrodata', 'BaseAgroData', 'baseagrodata.com', 'news-images', 'supabase')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  updated_at = NOW();

-- ------------------------------------------------------------
-- Notícias
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.news (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  content TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'comunidade',
  image_url TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  site_id TEXT NOT NULL DEFAULT 'entrecampos' REFERENCES public.sites(id),
  slug VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'published',
  author_id UUID,
  author_name TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS news_slug_site_uidx ON public.news (site_id, slug);
CREATE INDEX IF NOT EXISTS idx_news_site_date ON public.news (site_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_news_category_site ON public.news (category, site_id);
CREATE INDEX IF NOT EXISTS idx_news_status ON public.news (status);

-- Colunas extra se a tabela já existia noutro formato
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='updated_at') THEN
    ALTER TABLE public.news ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='status') THEN
    ALTER TABLE public.news ADD COLUMN status VARCHAR(32) NOT NULL DEFAULT 'published';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='author_id') THEN
    ALTER TABLE public.news ADD COLUMN author_id UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='news' AND column_name='author_name') THEN
    ALTER TABLE public.news ADD COLUMN author_name TEXT;
  END IF;
END $$;

-- ------------------------------------------------------------
-- Media (metadados). Ficheiros podem viver no Storage Supabase
-- ou no bucket S3/Hetzner (url pública em public_url).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_id TEXT NOT NULL DEFAULT 'entrecampos' REFERENCES public.sites(id),
  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  storage_driver TEXT NOT NULL DEFAULT 'supabase'
    CHECK (storage_driver IN ('supabase', 'hetzner_s3')),
  bucket TEXT NOT NULL DEFAULT 'entrecampos-media',
  object_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (site_id, object_key)
);

CREATE INDEX IF NOT EXISTS idx_media_site_created ON public.media_assets (site_id, created_at DESC);

-- ------------------------------------------------------------
-- Perfis de utilizadores da app (liga a auth.users)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'Subscritor',
  bio TEXT,
  website TEXT,
  avatar_url TEXT,
  articles_count INTEGER NOT NULL DEFAULT 0,
  site_id TEXT DEFAULT 'entrecampos' REFERENCES public.sites(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sites_public_read" ON public.sites;
CREATE POLICY "sites_public_read" ON public.sites FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "news_public_read" ON public.news;
CREATE POLICY "news_public_read" ON public.news
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "news_auth_write" ON public.news;
CREATE POLICY "news_auth_write" ON public.news
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "media_public_read" ON public.media_assets;
CREATE POLICY "media_public_read" ON public.media_assets FOR SELECT USING (true);

DROP POLICY IF EXISTS "media_auth_write" ON public.media_assets;
CREATE POLICY "media_auth_write" ON public.media_assets
  FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "ec_users_auth_read" ON public.ec_users;
CREATE POLICY "ec_users_auth_read" ON public.ec_users
  FOR SELECT USING (auth.role() = 'authenticated');

-- ------------------------------------------------------------
-- Storage bucket (metadados). Objectos reais podem ir para Hetzner.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
SELECT 'entrecampos-media', 'entrecampos-media', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'entrecampos-media');

INSERT INTO storage.buckets (id, name, public)
SELECT 'news-images', 'news-images', true
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'news-images');

DROP POLICY IF EXISTS "entrecampos_media_public_read" ON storage.objects;
CREATE POLICY "entrecampos_media_public_read"
ON storage.objects FOR SELECT
USING (bucket_id IN ('entrecampos-media', 'news-images'));

DROP POLICY IF EXISTS "entrecampos_media_auth_write" ON storage.objects;
CREATE POLICY "entrecampos_media_auth_write"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('entrecampos-media', 'news-images') AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "entrecampos_media_auth_update" ON storage.objects;
CREATE POLICY "entrecampos_media_auth_update"
ON storage.objects FOR UPDATE
USING (bucket_id IN ('entrecampos-media', 'news-images') AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "entrecampos_media_auth_delete" ON storage.objects;
CREATE POLICY "entrecampos_media_auth_delete"
ON storage.objects FOR DELETE
USING (bucket_id IN ('entrecampos-media', 'news-images') AND auth.role() = 'authenticated');
