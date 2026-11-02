-- Desfaz o sentido EntreCAMPOS -> Base (o EntreCAMPOS é o portal de notícias; a Base não recebe as suas notícias).
-- Mantém o sentido Base -> EntreCAMPOS (vista public.noticias_base). Corrido a 2026-11-02.
BEGIN;
DROP TRIGGER IF EXISTS copiar_noticia_para_base ON public.news;
DROP FUNCTION IF EXISTS public.trg_copiar_noticia_para_base();

-- Cópia de segurança das notícias que tinham sido copiadas para a Base (e que podem ter sido editadas lá)
CREATE TABLE IF NOT EXISTS basededados.bak_copias_entrecampos AS
  SELECT * FROM basededados.articles WHERE source = 'EntreCAMPOS';

DELETE FROM basededados.articles WHERE source = 'EntreCAMPOS';

DROP FUNCTION IF EXISTS basededados.copiar_noticias_entrecampos();
DROP VIEW IF EXISTS basededados.noticias_entrecampos;
DROP FUNCTION IF EXISTS basededados.categoria_da_base(text);

-- Categorias criadas só para essas notícias (as que nenhum artigo usa)
DELETE FROM basededados.news_categories c
 WHERE c.name IN ('Agricultura','Agro-negócio','Sector agrário','Fruticultura','Agropecuária','Apicultura',
                  'Agro-processamento','Segurança alimentar','Turismo rural')
   AND NOT EXISTS (SELECT 1 FROM basededados.articles a WHERE a.type = c.name OR c.name = ANY(a.categories));

DELETE FROM public.category_site_mapping WHERE site_id = 'baseagrodata';
COMMIT;

-- Ambiente (criada por engano na cópia) removida também.
DELETE FROM basededados.news_categories c WHERE name='Ambiente' AND NOT EXISTS (SELECT 1 FROM basededados.articles a WHERE a.type=c.name);
