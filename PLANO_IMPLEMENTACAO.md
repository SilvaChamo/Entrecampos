# EntreCAMPOS — estado do projecto

Site de notícias (Next.js 16 + Supabase auto-alojado). Painel em `/admin`.

## Como correr
- Desenvolvimento: `npm run dev` (porta 3004)
- Produção: `npm run build` e `npm start`; painel estável: `npm run painel:build` / `npm run painel` (porta 3005)
- Verificações: `npx tsc --noEmit` e `npm run lint`

## Cache (7 dias)
- Páginas públicas e dados das notícias: `revalidate = 604800` (7 dias).
- Gravar, apagar ou mudar o estado de uma notícia limpa logo o cache (`src/lib/refresh-site.ts`).
- Limpeza semanal, **sábados**: o cron do servidor chama `GET /api/cron/limpar-cache` com `Authorization: Bearer $CRON_SECRET`.
  Exemplo de crontab (sábado às 04:00 de Maputo = 02:00 UTC):
  `0 2 * * 6 curl -fsS -H "Authorization: Bearer SEGREDO" https://entrecamposblog.com/api/cron/limpar-cache`
- Imagens estáticas (`/images`) ficam 7 dias no navegador; uploads no Supabase levam `cacheControl` de 1 ano (nomes únicos).

## Fotos da redacção (e-mail)
- Painel: Multimédia → *Fotos da redacção (e-mail)* (`/admin/media/redaccao`).
- Lê por IMAP, em **modo só de leitura**, a caixa `redaccao@entrecamposblog.com`, mostra só anexos (fotos, PDF, MP4) e copia os escolhidos para a biblioteca (`redaccao/AAAA-MM/`), optimizados.
- Variáveis em `.env.local`: `IMAP_HOST`, `IMAP_PORT`, `IMAP_USER`, `IMAP_PASS` (e opcional `IMAP_FOLDER`).

## Por fazer (depende de dados externos)
- [ ] Preencher `IMAP_HOST` e `IMAP_PASS`.
- [ ] Chaves reais do Cloudflare Turnstile (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`); as actuais são de teste.
- [ ] Instalar o cron de sábado no servidor.

## Removido em 2026-11-04 (cópia em `../_removido-2026-11-04`)
LiteSpeed, Partilhado, Tráfego (dados inventados), Capacidades e Definições (páginas que não gravavam nada), e componentes do template Endeavor que não eram usados.
