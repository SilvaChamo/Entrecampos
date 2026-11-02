-- EntreCAMPOS (Supabase na cloud): colunas que o painel usa e que a tabela entrecampos_news ainda não tem.
-- Correr uma vez no SQL Editor do Supabase. Sem elas o painel grava na mesma, mas sem estas colunas.

ALTER TABLE public.entrecampos_news
  ADD COLUMN IF NOT EXISTS status      TEXT    NOT NULL DEFAULT 'Published',
  ADD COLUMN IF NOT EXISTS author_id   UUID,
  ADD COLUMN IF NOT EXISTS author_name TEXT,
  ADD COLUMN IF NOT EXISTS featured    BOOLEAN NOT NULL DEFAULT FALSE;  -- "Destaque": slide da página inicial

CREATE INDEX IF NOT EXISTS idx_entrecampos_news_featured
  ON public.entrecampos_news (featured, date DESC) WHERE featured;

-- A vista public.news mostra o estado fixo 'Published'. Para o arquivo/lixo funcionarem, recrie-a a ler
-- a coluna `status` de entrecampos_news (e `featured`, se a quiser na vista).
