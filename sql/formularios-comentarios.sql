-- Comentários (moderados), mensagens de contacto e subscrições da newsletter do EntreCAMPOS.
-- Só o servidor (service_role) escreve; o público só lê os comentários aprovados.
-- Idempotente. Correr como supabase_admin.
BEGIN;

CREATE TABLE IF NOT EXISTS public.comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    TEXT NOT NULL DEFAULT 'entrecampos',
  news_slug  TEXT NOT NULL,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  website    TEXT,
  content    TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'trash')),
  ip_hash    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_slug_status ON public.comments (news_slug, status, created_at);

CREATE TABLE IF NOT EXISTS public.contact_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id    TEXT NOT NULL DEFAULT 'entrecampos',
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT,
  message    TEXT NOT NULL,
  read_at    TIMESTAMPTZ,
  ip_hash    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (A newsletter usa a tabela própria public.entrecampos_newsletter: ver sql/reparar-newsletter.sql.
--  NÃO usar public.newsletter_subscribers: pertence a outro site.)

ALTER TABLE public.comments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comments_leitura_publica ON public.comments;
CREATE POLICY comments_leitura_publica ON public.comments FOR SELECT TO anon, authenticated USING (status = 'approved');

-- Colunas sensíveis (e-mail, ip) não são legíveis pelo público
REVOKE ALL ON public.comments, public.contact_messages FROM anon, authenticated;
GRANT SELECT (id, site_id, news_slug, name, website, content, status, created_at) ON public.comments TO anon, authenticated;
GRANT ALL ON public.comments, public.contact_messages TO service_role;

NOTIFY pgrst, 'reload schema';
COMMIT;
