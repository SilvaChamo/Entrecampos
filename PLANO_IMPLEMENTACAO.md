# Plano de Implementação - EntreCAMPOS

## Objetivo
Migrar site WordPress Entrecampos (agricultura/notícias) para Next.js usando template endeavor-nextjs-pro.

## Tarefas para Implementação

---

### ✅ TAREFA 1: Configurar Porta 3003
**Arquivo:** `package.json`
**Ação:** Alterar script dev de `next dev` para `next dev -p 3003`
**Verificação:** Rodar `npm run dev` e confirmar que inicia em `localhost:3003`

---

### ✅ TAREFA 2: Copiar Estrutura do Template
**Origem:** `/Users/macbook/BackUp/——— BackUp/—— WEB/___ SITES/— Base/APP/TAMPLANTES/endeavor-nextjs-pro-v1-2/package/`
**Destino:** `/Users/macbook/Desktop/APP/entrecampos/`

**Ações:**
1. Copiar pasta `src/components/` → manter estrutura existente se houver
2. Copiar pasta `src/app/` → fazer merge cuidadosamente
3. Copiar arquivos de config: `tsconfig.json`, `postcss.config.mjs`
4. Atualizar `package.json` com dependências do template
5. Copiar `next.config.mjs` do template e adaptar

**Verificação:** `npm install` deve funcionar sem erros

---

### ✅ TAREFA 3: Analisar XML Entrecampos
**Arquivo:** `/Users/macbook/BackUp/——— BackUp/—— WEB/___ SITES/EntreCAMPOS/— BACKUP/entrecampos.WordPress.2026-04-21 (1).xml`

**Ações:**
1. Contar quantidade de: posts, páginas, imagens, categorias
2. Listar todas as categorias principais (ex: Agricultura, Agro-negocio)
3. Extrair URLs das imagens anexadas
4. Identificar página inicial/homepage

**Output:** Criar arquivo `analise-xml.json` com estrutura resumida

---

### ✅ TAREFA 4: Criar Parser XML → JSON
**Criar arquivo:** `scripts/parse-wordpress.js`

**Requisitos:**
- Ler XML do WordPress
- Extrair posts com: título, conteúdo, data, autor, categoria, slug
- Extrair páginas separadamente
- Extrair metadata das imagens (URL, alt text, dimensões)
- Salvar em: `data/posts.json`, `data/pages.json`, `data/images.json`

**Verificação:** Rodar `node scripts/parse-wordpress.js` deve gerar os 3 arquivos JSON

---

### ✅ TAREFA 5: Criar Rotas Dinâmicas
**Arquivos a criar:**
- `src/app/noticias/[slug]/page.tsx` - página de post individual
- `src/app/categoria/[slug]/page.tsx` - página de categoria
- `src/app/pagina/[slug]/page.tsx` - páginas estáticas do WordPress

**Requisitos:**
- Usar generateStaticParams para pré-renderizar todas as rotas
- Layout deve usar componentes do template endeavor
- Mostrar título, data, autor, conteúdo HTML
- Suportar categorias: Agricultura, Agro-negocio, etc.

---

### ✅ TAREFA 6: Criar Homepage
**Arquivo:** `src/app/page.tsx`

**Requisitos:**
- Hero section com destaque (última notícia principal)
- Grid de notícias recentes por categoria
- Sidebar com categorias populares
- Footer com links institucionais
- Usar design do template endeavor adaptado para tema agricultura

**Cores sugeridas:** Verde (natureza/agricultura), branco, tons terrosos

---

### ✅ TAREFA 7: Adaptar Estilos e Tema
**Arquivos:**
- `src/app/globals.css` - cores Entrecampos
- `tailwind.config.ts` - adicionar cores customizadas

**Paleta:**
- Primária: `#2E7D32` (verde agricultura)
- Secundária: `#795548` (marrom/terra)
- Background: `#FAFAFA` (off-white)
- Texto: `#212121` (quase preto)

---

### ✅ TAREFA 8: Testar Build
**Comandos:**
```bash
npm run build
```

**Verificações:**
- Sem erros de compilação
- Todas as páginas geradas em `.next/`
- Imagens otimizadas
- Links funcionando

---

## Ordem de Execução Recomendada
1 → 2 → 3 → 4 → 7 → 6 → 5 → 8

## Critérios de Sucesso
- [ ] Site roda em localhost:3003
- [ ] Homepage mostra notícias do XML
- [ ] Posts individuais acessíveis via /noticias/[slug]
- [ ] Categorias funcionam em /categoria/[slug]
- [ ] Build completo sem erros
