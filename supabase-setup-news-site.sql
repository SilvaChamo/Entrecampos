-- ============================================
-- SUPABASE SETUP - SITE DE NOTÍCIAS ENTRECAMPOS
-- ============================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABELA DE CATEGORIAS
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(7), -- Hex color
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. TABELA DE POSTS/NOTÍCIAS
-- ============================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT false,
  is_breaking_news BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TABELA DE RELAÇÃO POST-CATEGORIA (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS post_categories (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, category_id)
);

-- ============================================
-- 4. TABELA DE TAGS
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. TABELA DE RELAÇÃO POST-TAG (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, tag_id)
);

-- ============================================
-- 6. TABELA DE COMENTÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  author_name VARCHAR(100),
  author_email VARCHAR(255),
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'spam')),
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 7. TABELA DE SUBSCRIÇÕES (NEWSLETTER)
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  unsubscribe_token VARCHAR(255) UNIQUE,
  preferences JSONB DEFAULT '{"categories": [], "frequency": "daily"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 8. TABELA DE PERFIS DE USUÁRIOS (Extensão do auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name VARCHAR(100),
  avatar_url TEXT,
  bio TEXT,
  website VARCHAR(255),
  location VARCHAR(100),
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'reader' CHECK (role IN ('reader', 'author', 'editor', 'admin')),
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 9. TABELA DE MEDIA/IMAGENS
-- ============================================
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255),
  mime_type VARCHAR(100),
  size INTEGER,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  caption TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 10. TABELA DE POST_MEDIA (Relação Post-Imagens)
-- ============================================
CREATE TABLE IF NOT EXISTS post_media (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  media_id UUID REFERENCES media(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (post_id, media_id)
);

-- ============================================
-- 11. TABELA DE VIEWS (Contagem de visualizações)
-- ============================================
CREATE TABLE IF NOT EXISTS post_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 12. TABELA DE LIKES/REAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- 13. TABELA DE BOOKMARKS/SALVOS
-- ============================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ============================================
-- 14. TABELA DE NOTIFICAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 15. TABELA DE SETTINGS/CONFIGURAÇÕES DO SITE
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_published_at ON posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_featured ON posts(is_featured) WHERE is_featured = true;

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active) WHERE is_active = true;

-- Comments
CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Post Views
CREATE INDEX IF NOT EXISTS idx_post_views_post ON post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_date ON post_views(viewed_at DESC);

-- Likes
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);

-- Bookmarks
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_post ON bookmarks(post_id);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read) WHERE is_read = false;

-- ============================================
-- TRIGGERS PARA UPDATED_AT AUTOMÁTICO
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar trigger nas tabelas com updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Habilitar RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Categories - Todos podem ler, apenas admin escreve
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert categories" ON categories
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only admins can update categories" ON categories
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Posts - Todos podem ler posts publicados
CREATE POLICY "Published posts are viewable by everyone" ON posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Authors can view their own posts" ON posts
  FOR SELECT USING (auth.uid() = author_id);

CREATE POLICY "Authenticated users can insert posts" ON posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authors can update their own posts" ON posts
  FOR UPDATE USING (auth.uid() = author_id);

-- Comments - Todos podem ler, autenticados podem comentar
CREATE POLICY "Approved comments are viewable by everyone" ON comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Authenticated users can insert comments" ON comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Subscriptions - Todos podem subscrever
CREATE POLICY "Anyone can insert subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Subscriptions are viewable by everyone" ON subscriptions
  FOR SELECT USING (true);

-- Profiles - Todos podem ler perfis, apenas dono pode editar
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Likes - Autenticados podem dar like
CREATE POLICY "Authenticated users can like posts" ON post_likes
  FOR ALL USING (auth.uid() = user_id);

-- Bookmarks - Autenticados podem salvar
CREATE POLICY "Authenticated users can bookmark posts" ON bookmarks
  FOR ALL USING (auth.uid() = user_id);

-- Notifications - Apenas dono pode ver
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- DADOS INICIAIS (SEED DATA)
-- ============================================

-- Categorias iniciais
INSERT INTO categories (name, slug, description, color, order_index) VALUES
  ('Agricultura', 'agricultura', 'Notícias sobre agricultura e cultivo', '#22c55e', 1),
  ('Agro-negócio', 'agro-negocio', 'Oportunidades de negócio no setor agrário', '#3b82f6', 2),
  ('Comunidade', 'comunidade', 'Desenvolvimento rural e comunidades', '#f59e0b', 3),
  ('Ambiente', 'ambiente', 'Sustentabilidade e meio ambiente', '#10b981', 4),
  ('Turismo Rural', 'turismo-rural', 'Turismo e lazer rural', '#8b5cf6', 5),
  ('Mulher Agrário', 'mulher-agrario', 'Empoderamento feminino no setor agrário', '#ec4899', 6),
  ('Curiosidade', 'curiosidade', 'Curiosidades e fatos interessantes', '#6366f1', 7)
ON CONFLICT (slug) DO NOTHING;

-- Configurações do site
INSERT INTO site_settings (key, value, description) VALUES
  ('site_name', 'EntreCAMPOS', 'Nome do site'),
  ('site_description', 'Promovendo o desenvolvimento agrícola em Moçambique', 'Descrição do site'),
  ('site_keywords', 'agricultura, moçambique, agro-negócio, desenvolvimento rural', 'Palavras-chave SEO'),
  ('contact_email', 'geral@entrecampos.co.mz', 'Email de contacto'),
  ('contact_phone', '+258 84 000 0000', 'Telefone de contacto'),
  ('contact_address', 'Av. Karl Marx nº 177', 'Endereço'),
  ('social_facebook', 'https://facebook.com', 'Facebook URL'),
  ('social_instagram', 'https://instagram.com', 'Instagram URL'),
  ('social_youtube', 'https://youtube.com', 'YouTube URL'),
  ('social_whatsapp', 'https://wa.me/258000000000', 'WhatsApp URL')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- FUNÇÕES ÚTEIS
-- ============================================

-- Função para incrementar view count
CREATE OR REPLACE FUNCTION increment_post_view_count(post_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts 
  SET view_count = view_count + 1 
  WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- Função para contar likes de um post
CREATE OR REPLACE FUNCTION get_post_like_count(post_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) 
    FROM post_likes 
    WHERE post_id = post_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se usuário deu like
CREATE OR REPLACE FUNCTION user_liked_post(post_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM post_likes 
    WHERE post_id = post_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS ÚTEIS
-- ============================================

-- View de posts com categorias
CREATE OR REPLACE VIEW posts_with_categories AS
SELECT 
  p.*,
  COALESCE(
    json_agg(
      json_build_object(
        'id', c.id,
        'name', c.name,
        'slug', c.slug,
        'color', c.color,
        'is_primary', pc.is_primary
      ) ORDER BY pc.is_primary DESC
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::json
  ) as categories
FROM posts p
LEFT JOIN post_categories pc ON p.id = pc.post_id
LEFT JOIN categories c ON pc.category_id = c.id
GROUP BY p.id;

-- View de posts com contagem de likes
CREATE OR REPLACE VIEW posts_with_stats AS
SELECT 
  p.*,
  (SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.id) as like_count,
  (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id AND c.status = 'approved') as comment_count
FROM posts p;

-- ============================================
-- FIM DO SETUP
-- ============================================
