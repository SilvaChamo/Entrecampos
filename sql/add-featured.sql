-- EntreCAMPOS: campo "Destaque" (slide da página inicial).
-- Executar uma vez no Supabase self-hosted (SQL editor) ANTES de usar a caixa "Destaque" no dashboard.

ALTER TABLE public.entrecampos_news
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_entrecampos_news_featured
  ON public.entrecampos_news (featured, date DESC)
  WHERE featured;

-- A home lê diretamente de public.entrecampos_news; se existir a view `news` que junta os sites,
-- recrie-a depois deste ALTER para que a nova coluna também apareça nela.
