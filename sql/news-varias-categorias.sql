-- Várias categorias por notícia (Supabase self-hosted, tabela public.news).
-- `category` continua a ser a categoria principal (primeira escolhida); `categories` guarda todas.
-- Idempotente. Executar como supabase_admin:
--   cat sql/news-varias-categorias.sql | ssh -i ~/.ssh/claude_contabo contabo \
--     "docker exec -i supabase-db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1"
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS categories TEXT[];
NOTIFY pgrst, 'reload schema';
