-- ============================================
-- SUPABASE: CRIAR TABELA news + CONFIGURAÇÃO DE PARTILHA
-- ============================================

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. CRIAR TABELA news (baseado no schema do baseagrodata)
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
  -- Campos adicionais para partilha entre sites
  site_id VARCHAR(50) DEFAULT 'baseagrodata',
  slug VARCHAR(255) UNIQUE
);

-- Índices para performance
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

-- ============================================
-- 3. CATEGORIAS DA BASE DE DADOS (baseagrodata)
-- ============================================
INSERT INTO category_site_mapping (category, site_id, is_visible) VALUES
  ('agricultura', 'baseagrodata', true),
  ('agro-negocio', 'baseagrodata', true),
  ('comunidade', 'baseagrodata', true),
  ('ambiente', 'baseagrodata', true),
  ('turismo-rural', 'baseagrodata', true),
  ('mulher-agrario', 'baseagrodata', true),
  ('curiosidade', 'baseagrodata', true)
ON CONFLICT (category, site_id) DO NOTHING;

-- ============================================
-- 4. CATEGORIAS DO ENTRECAMPOS (jornal)
-- ============================================
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
-- 5. FUNÇÃO PARA DETERMINAR VISIBILIDADE
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
-- 6. VIEW PARA NOTÍCIAS DO ENTRECAMPOS
-- ============================================
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

-- ============================================
-- 7. VIEW PARA NOTÍCIAS DA BASE DE DADOS
-- ============================================
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
-- 8. FUNÇÕES DE CONVENIÊNCIA
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
-- 9. RLS POLICIES
-- ============================================
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_site_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "News are viewable by everyone" ON news
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert news" ON news
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Category mapping is viewable by everyone" ON category_site_mapping
  FOR SELECT USING (true);

-- ============================================
-- 10. DADOS DE EXEMPLO
-- ============================================

INSERT INTO news (title, summary, content, category, image_url, site_id, date, slug)
VALUES
  ('Técnicas modernas de irrigação em Moçambique', 'Novas tecnologias de irrigação estão revolucionando a agricultura no país.', 'Conteúdo completo sobre irrigação...', 'agricultura', 'https://example.com/image1.jpg', 'entrecampos', NOW(), 'tecnicas-irrigacao-mocambique'),
  ('Comunidade rural de Gaza recebe apoio agrícola', 'Projeto de desenvolvimento rural beneficia mais de 500 famílias.', 'Conteúdo completo sobre comunidade...', 'comunidade', 'https://example.com/image2.jpg', 'entrecampos', NOW(), 'comunidade-gaza-apoio-agricola'),
  ('Preços do milho aumentam 15% no mercado de Maputo', 'Variação nos preços do milho devido à escassez de chuvas.', 'Conteúdo completo sobre preços...', 'agricultura', 'https://example.com/image3.jpg', 'baseagrodata', NOW(), 'precos-milho-maputo')
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- FIM
-- ============================================
