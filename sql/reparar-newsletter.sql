-- 2026-11-02: o script formularios-comentarios.sql alterou, por engano, as permissões de public.newsletter_subscribers,
-- que já existia e é de OUTRO site. Repõe as permissões por defeito do Supabase (a RLS dessa tabela continua a decidir
-- quem lê/escreve) e cria a tabela PRÓPRIA do EntreCAMPOS.
BEGIN;
GRANT ALL ON public.newsletter_subscribers TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.entrecampos_newsletter (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      TEXT NOT NULL UNIQUE,
  ip_hash    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.entrecampos_newsletter ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.entrecampos_newsletter FROM anon, authenticated;
GRANT ALL ON public.entrecampos_newsletter TO service_role;
NOTIFY pgrst, 'reload schema';
COMMIT;
