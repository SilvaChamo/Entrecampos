-- ============================================
-- SUPABASE SETUP - ENTRECAMPOS + BASEAGRODATA
-- Script único e seguro para base de dados existente
-- ============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CRIAR TABELA news (SE NÃO EXISTIR)
-- Baseado no schema do baseagrodata.com
-- ============================================
CREATE TABLE IF NOT EXISTS news (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  content TEXT,
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  site_id VARCHAR(50) DEFAULT 'baseagrodata',
  slug VARCHAR(255) UNIQUE
);

-- Adicionar coluna site_id SE NÃO EXISTIR (para tabelas já criadas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'site_id'
  ) THEN
    ALTER TABLE news ADD COLUMN site_id VARCHAR(50) DEFAULT 'baseagrodata';
  END IF;
END $$;

-- Adicionar coluna slug SE NÃO EXISTIR
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'news' AND column_name = 'slug'
  ) THEN
    ALTER TABLE news ADD COLUMN slug VARCHAR(255) UNIQUE;
  END IF;
END $$;

-- Índices (só criam se não existirem)
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);
CREATE INDEX IF NOT EXISTS idx_news_date ON news(date DESC);
CREATE INDEX IF NOT EXISTS idx_news_site_id ON news(site_id);
CREATE INDEX IF NOT EXISTS idx_news_category_site ON news(category, site_id);
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);

-- ============================================
-- 2. TABELA DE MAPEAMENTO DE CATEGORIAS POR SITE
-- ============================================
CREATE TABLE IF NOT EXISTS category_site_mapping (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  site_id VARCHAR(50) NOT NULL,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category, site_id)
);

-- Categorias da base de dados (baseagrodata)
INSERT INTO category_site_mapping (category, site_id, is_visible) VALUES
  ('agricultura', 'baseagrodata', true),
  ('agro-negocio', 'baseagrodata', true),
  ('comunidade', 'baseagrodata', true),
  ('ambiente', 'baseagrodata', true),
  ('turismo-rural', 'baseagrodata', true),
  ('mulher-agrario', 'baseagrodata', true),
  ('curiosidade', 'baseagrodata', true)
ON CONFLICT (category, site_id) DO NOTHING;

-- Categorias do entrecampos (jornal)
INSERT INTO category_site_mapping (category, site_id, is_visible) VALUES
  ('agricultura', 'entrecampos', true),
  ('agro-negocio', 'entrecampos', true),
  ('comunidade', 'entrecampos', true),
  ('ambiente', 'entrecampos', true),
  ('turismo-rural', 'entrecampos', true),
  ('mulher-agrario', 'entrecampos', true),
  ('curiosidade', 'entrecampos', true),
  ('dicas', 'entrecampos', true),
  ('eventos', 'entrecampos', true),
  ('entrevistas', 'entrecampos', true),
  ('opiniao', 'entrecampos', true)
ON CONFLICT (category, site_id) DO NOTHING;

-- ============================================
-- 3. FUNÇÃO PARA VERIFICAR VISIBILIDADE
-- ============================================
CREATE OR REPLACE FUNCTION is_news_visible_in_site(
  p_category VARCHAR,
  p_target_site VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM category_site_mapping 
    WHERE category = p_category 
    AND site_id = p_target_site 
    AND is_visible = true
  ) INTO v_exists;
  
  RETURN v_exists;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. VIEWS PARA CADA SITE
-- ============================================

-- View para entrecampos (todas as notícias)
CREATE OR REPLACE VIEW entrecampos_news AS
SELECT 
  n.*,
  CASE 
    WHEN n.site_id = 'entrecampos' THEN true
    WHEN is_news_visible_in_site(n.category, 'entrecampos') THEN true
    ELSE false
  END as visible_in_entrecampos
FROM news n
WHERE 
  n.site_id = 'entrecampos' 
  OR is_news_visible_in_site(n.category, 'entrecampos');

-- View para baseagrodata (apenas categorias existentes)
CREATE OR REPLACE VIEW baseagrodata_news AS
SELECT 
  n.*,
  CASE 
    WHEN n.site_id = 'baseagrodata' THEN true
    WHEN is_news_visible_in_site(n.category, 'baseagrodata') THEN true
    ELSE false
  END as visible_in_baseagrodata
FROM news n
WHERE 
  n.site_id = 'baseagrodata' 
  OR is_news_visible_in_site(n.category, 'baseagrodata');

-- ============================================
-- 5. FUNÇÕES DE CONVENIÊNCIA
-- ============================================

CREATE OR REPLACE FUNCTION get_entrecampos_news(p_limit INTEGER DEFAULT 10, p_offset INTEGER DEFAULT 0)
RETURNS SETOF news AS $$
BEGIN
  RETURN QUERY
  SELECT n.*
  FROM news n
  WHERE 
    n.site_id = 'entrecampos'
    OR is_news_visible_in_site(n.category, 'entrecampos')
  ORDER BY n.date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_baseagrodata_news(p_limit INTEGER DEFAULT 10, p_offset INTEGER DEFAULT 0)
RETURNS SETOF news AS $$
BEGIN
  RETURN QUERY
  SELECT n.*
  FROM news n
  WHERE 
    n.site_id = 'baseagrodata'
    OR is_news_visible_in_site(n.category, 'baseagrodata')
  ORDER BY n.date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 6. RLS POLICIES (segurança)
-- ============================================
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_site_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "News are viewable by everyone" ON news
  FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert news" ON news
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Category mapping is viewable by everyone" ON category_site_mapping
  FOR SELECT USING (true);

-- ============================================
-- 7. DADOS DE EXEMPLO (apenas se tabela vazia)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM news LIMIT 1) THEN
    INSERT INTO news (title, summary, content, category, image_url, site_id, date, slug)
    VALUES
      ('Técnicas modernas de irrigação em Moçambique', 'Novas tecnologias de irrigação estão revolucionando a agricultura no país.', 'Conteúdo completo sobre irrigação...', 'agricultura', 'https://example.com/image1.jpg', 'entrecampos', NOW(), 'tecnicas-irrigacao-mocambique'),
      ('Comunidade rural de Gaza recebe apoio agrícola', 'Projeto de desenvolvimento rural beneficia mais de 500 famílias.', 'Conteúdo completo sobre comunidade...', 'comunidade', 'https://example.com/image2.jpg', 'entrecampos', NOW(), 'comunidade-gaza-apoio-agricola'),
      ('Preços do milho aumentam 15% no mercado de Maputo', 'Variação nos preços do milho devido à escassez de chuvas.', 'Conteúdo completo sobre preços...', 'agricultura', 'https://example.com/image3.jpg', 'baseagrodata', NOW(), 'precos-milho-maputo');
  END IF;
END $$;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

-- No entrecampos:
-- SELECT * FROM get_entrecampos_news(10, 0);
-- Ou: SELECT * FROM entrecampos_news ORDER BY date DESC LIMIT 10;

-- Na baseagrodata:
-- SELECT * FROM get_baseagrodata_news(10, 0);
-- Ou: SELECT * FROM baseagrodata_news ORDER BY date DESC LIMIT 10;

-- Para adicionar nova notícia:
-- INSERT INTO news (title, summary, content, category, image_url, site_id, slug)
-- VALUES ('Título', 'Resumo', 'Conteúdo', 'agricultura', 'url.jpg', 'entrecampos', 'slug-unico');

-- ============================================
-- FIM
-- ============================================
