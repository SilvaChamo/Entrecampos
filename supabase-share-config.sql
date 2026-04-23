-- ============================================
-- SUPABASE CONFIGURAÇÃO DE PARTILHA DE DADOS
-- NÃO ALTERA ESTRUTURA EXISTENTE - APENAS ADICIONA
-- ============================================

-- ============================================
-- 1. ADICIONAR site_id À TABELA news EXISTENTE
-- ============================================
ALTER TABLE news ADD COLUMN IF NOT EXISTS site_id VARCHAR(50) DEFAULT 'baseagrodata';

-- Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_news_site_id ON news(site_id);
CREATE INDEX IF NOT EXISTS idx_news_category_site ON news(category, site_id);

-- ============================================
-- 2. TABELA DE MAPEAMENTO DE CATEGORIAS POR SITE
-- Controla quais categorias aparecem em cada site
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
-- Estas são as categorias que existem no sistema baseagrodata
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
-- Todas as categorias do entrecampos
-- Apenas as que existem na base de dados serão visíveis lá
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
-- 5. FUNÇÃO PARA DETERMINAR SE NOTÍCIA DEVE APARECER EM SITE
-- ============================================
CREATE OR REPLACE FUNCTION is_news_visible_in_site(
  p_category VARCHAR,
  p_target_site VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Verifica se a categoria existe no site alvo
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
-- Mostra todas as notícias (baseagrodata + entrecampos)
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
-- Mostra apenas notícias de categorias que existem na base de dados
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
-- 8. FUNÇÃO PARA ADICIONAR NOTÍCIA COM LÓGICA DE PARTILHA
-- ============================================
CREATE OR REPLACE FUNCTION add_news_with_sharing(
  p_title VARCHAR,
  p_content TEXT,
  p_summary TEXT,
  p_category VARCHAR,
  p_image_url VARCHAR,
  p_site_id VARCHAR DEFAULT 'entrecampos'
)
RETURNS UUID AS $$
DECLARE
  v_news_id UUID;
BEGIN
  -- Insere a notícia
  INSERT INTO news (
    title, 
    content, 
    summary, 
    category, 
    image_url, 
    site_id,
    date
  ) VALUES (
    p_title,
    p_content,
    p_summary,
    p_category,
    p_image_url,
    p_site_id,
    NOW()
  ) RETURNING id INTO v_news_id;
  
  RETURN v_news_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGER PARA ATUALIZAR VISIBILIDADE AUTOMATICAMENTE
-- Quando uma notícia é inserida, verifica se deve ser visível
-- ============================================
CREATE OR REPLACE FUNCTION check_news_visibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Se site_id é entrecampos e categoria não existe na base de dados
  -- marca como não visível na base de dados (lógica aplicacional)
  IF NEW.site_id = 'entrecampos' THEN
    IF NOT is_news_visible_in_site(NEW.category, 'baseagrodata') THEN
      -- Notícia não aparecerá na base de dados
      -- (aplicação deve filtrar usando a view)
      NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 10. RLS POLICIES PARA category_site_mapping
-- ============================================
ALTER TABLE category_site_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Category mapping is viewable by everyone" ON category_site_mapping
  FOR SELECT USING (true);

CREATE POLICY "Only admins can modify category mapping" ON category_site_mapping
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 11. ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_category_mapping_category ON category_site_mapping(category);
CREATE INDEX IF NOT EXISTS idx_category_mapping_site ON category_site_mapping(site_id);
CREATE INDEX IF NOT EXISTS idx_category_mapping_visible ON category_site_mapping(is_visible) WHERE is_visible = true;

-- ============================================
-- 12. FUNÇÕES DE CONVENIÊNCIA PARA APLICAÇÃO
-- ============================================

-- Obter notícias para entrecampos
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

-- Obter notícias para baseagrodata
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

-- Obter categorias disponíveis para um site
CREATE OR REPLACE FUNCTION get_site_categories(p_site_id VARCHAR)
RETURNS TABLE(category VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT category
  FROM category_site_mapping
  WHERE site_id = p_site_id AND is_visible = true
  ORDER BY category;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 13. DADOS DE EXEMPLO PARA TESTE
-- ============================================

-- Notícia que aparece em ambos (agricultura)
INSERT INTO news (title, summary, content, category, image_url, site_id, date)
VALUES (
  'Técnicas modernas de irrigação em Moçambique',
  'Novas tecnologias de irrigação estão revolucionando a agricultura no país.',
  'Conteúdo completo sobre irrigação...',
  'agricultura',
  'https://example.com/image1.jpg',
  'entrecampos',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Notícia que aparece apenas no entrecampos (comunidade)
INSERT INTO news (title, summary, content, category, image_url, site_id, date)
VALUES (
  'Comunidade rural de Gaza recebe apoio agrícola',
  'Projeto de desenvolvimento rural beneficia mais de 500 famílias.',
  'Conteúdo completo sobre comunidade...',
  'comunidade',
  'https://example.com/image2.jpg',
  'entrecampos',
  NOW()
)
ON CONFLICT DO NOTHING;

-- Notícia da base de dados (agricultura)
INSERT INTO news (title, summary, content, category, image_url, site_id, date)
VALUES (
  'Preços do milho aumentam 15% no mercado de Maputo',
  'Variação nos preços do milho devido à escassez de chuvas.',
  'Conteúdo completo sobre preços...',
  'agricultura',
  'https://example.com/image3.jpg',
  'baseagrodata',
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================
-- INSTRUÇÕES DE USO
-- ============================================

-- Na aplicação entrecampos:
-- SELECT * FROM get_entrecampos_news(10, 0);
-- Ou: SELECT * FROM entrecampos_news ORDER BY date DESC LIMIT 10;

-- Na aplicação baseagrodata:
-- SELECT * FROM get_baseagrodata_news(10, 0);
-- Ou: SELECT * FROM baseagrodata_news ORDER BY date DESC LIMIT 10;

-- Para adicionar nova categoria ao entrecampos:
-- INSERT INTO category_site_mapping (category, site_id, is_visible)
-- VALUES ('nova-categoria', 'entrecampos', true);

-- Para adicionar nova notícia:
-- SELECT add_news_with_sharing('Título', 'Conteúdo', 'Resumo', 'agricultura', 'url.jpg', 'entrecampos');

-- ============================================
-- FIM DA CONFIGURAÇÃO
-- ============================================
