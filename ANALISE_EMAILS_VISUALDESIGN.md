# Análise: Problema de Emails no Painel Admin - visualdesign

## Data: 21/04/2026
## Investigador: Cascade (para decisão conjunta amanhã)

---

## 🔍 O QUE ENCONTREI

### 1. Estrutura Atual do Painel Admin
**Arquivo:** `visualdesign/src/app/admin/emails/[email]/page.tsx`

**Problema identificado:**
- Lista de pastas está **HARDCODED**: `['INBOX', 'Sent', 'Trash']` (linha 27)
- Não consulta pastas reais do servidor IMAP
- Apenas mostra estas 3 pastas fixas, ignorando outras existentes no servidor

```tsx
const [folders, setFolders] = useState<string[]>(['INBOX', 'Sent', 'Trash'])
```

### 2. API de Leitura de Emails
**Arquivo:** `visualdesign/src/app/api/read-emails/route.ts`

**O que faz bem:**
- Tem lógica complexa de mapeamento de pastas (linhas 87-123)
- Suporta variações de nomes: `Sent`/`Sent Items`/`Enviados`, `Trash`/`Lixo`/`Deleted Items`
- Detecta pastas com prefixo `INBOX.` ou sem prefixo
- Lista pastas reais do servidor via `client.list()`

**Problema:**
- Retorna `folderTotals` mas o painel admin **NÃO USA** esta informação para atualizar a lista de pastas
- Linha 76: `if (data.folders) { setFolders(data.folders) }` — nunca executa porque API não retorna `folders`

### 3. Debug de Pastas IMAP
**Arquivo:** `visualdesign/src/app/api/debug-imap-folders/route.ts`

**Função:** Endpoint separado que lista todas as pastas do servidor IMAP corretamente.
- Retorna: `allFolders` com path, flags, specialUse
- Testa pastas comuns: INBOX, Sent, Drafts, Trash, Archive, Spam, Junk

---

## 🎯 DIAGNÓSTICO DO PROBLEMA

**Causa raiz:** Desconexão entre API e Painel Admin

```
┌─────────────────────────────────────────────┐
│  SERVIDOR IMAP (CyberPanel/SnappyMail)      │
│  Pastas reais:                              │
│  - INBOX                                    │
│  - INBOX.Sent                               │
│  - INBOX.Trash                              │
│  - INBOX.Archive                            │
│  - INBOX.Drafts                             │
│  - INBOX.Junk                               │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  API read-emails (FUNCIONA)                 │
│  - Lista pastas corretamente                │
│  - Retorna folderTotals                     │
│  - Mas NÃO retorna lista de pastas          │
└────────────┬────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────┐
│  PAINEL ADMIN (PROBLEMA)                    │
│  - Mostra apenas: ['INBOX', 'Sent', 'Trash']│
│  - IGNORA pastas reais do servidor          │
│  - Emails parecem "desaparecer"             │
└─────────────────────────────────────────────┘
```

**Exemplo:** Se email está em `INBOX.Archive`, o utilizador NÃO VÈ porque a pasta Archive não aparece na sidebar.

---

## 💡 POSSÍVEIS SOLUÇÕES (para decidirmos amanhã)

### Opção A: Corrigir API + Painel (RECOMENDADA)
**Complexidade:** Média | **Tempo:** 2-3 horas

1. Modificar API `read-emails` para retornar lista completa de pastas:
   ```ts
   return { 
     success: true, 
     emails: [...],
     folders: ['INBOX', 'INBOX.Sent', 'INBOX.Trash', 'INBOX.Archive', ...] 
   }
   ```

2. Painel admin usar esta lista em vez do hardcoded

3. Mapear nomes amigáveis: `INBOX.Archive` → "Arquivo"

### Opção B: Copiar Lógica SnappyMail (mais complexa)
**Complexidade:** Alta | **Tempo:** 1-2 dias

SnappyMail está em `visualdesign/snappymail/` mas pasta `data/` está vazia — parece que a integração real é via IMAP direto, não via SSO/iframe.

Para usar SnappyMail "de verdade":
1. Instanciar SnappyMail dentro do Next.js
2. Criar bridge entre auth do painel admin e sessão SnappyMail
3. Usar componentes de UI do SnappyMail (muito trabalho)

### Opção C: Usar Debug Endpoint
**Complexidade:** Baixa | **Tempo:** 1 hora

1. Painel admin chama `/api/debug-imap-folders` ao carregar
2. Popula sidebar com pastas reais do servidor
3. Mantém lógica de leitura atual

---

## 📋 TAREFAS PARA PLANO DE EXECUÇÃO (amanhã decidimos)

### Se escolhermos Opção A (Recomendada):
- [ ] T1: Modificar `read-emails/route.ts` para incluir `allFolders` na resposta
- [ ] T2: Criar função de mapeamento de nomes (INBOX.Archive → Arquivo)
- [ ] T3: Atualizar `admin/emails/[email]/page.tsx` para usar pastas dinâmicas
- [ ] T4: Adicionar ícones para pastas especiais (Archive, Drafts, Junk)
- [ ] T5: Testar com conta real do visualdesign

### Se escolhermos Opção C:
- [ ] T1: Integrar chamada a `debug-imap-folders` no carregamento do painel
- [ ] T2: Atualizar estado `folders` com resultado do servidor
- [ ] T3: Testar visualização de diferentes pastas

---

## 🚨 QUESTÕES EM ABERTO

1. **SnappyMail realmente necessário?** — O sistema atual já usa IMAP direto. SnappyMail adicionaria UI pronta mas complexidade alta.

2. **Quais pastas devem aparecer?** — Todas do servidor ou filtrar (esconder INBOX.Drafts se vazia)?

3. **Contagem de não-lidos?** — Já está implementado no `folderTotals`, mas não aparece na sidebar. Mostrar badges?

4. **Permissões?** — Todos os admins veem todas as pastas de todas as contas?

---

## 📁 FICHEIROS CHAVE IDENTIFICADOS

| Ficheiro | Função | Linhas críticas |
|----------|--------|-----------------|
| `src/app/admin/emails/[email]/page.tsx` | Painel admin UI | 27 (folders hardcoded), 75-76 (ignora folders da API) |
| `src/app/api/read-emails/route.ts` | API leitura emails | 87-123 (mapeamento pastas), 264-325 (folderTotals) |
| `src/app/api/debug-imap-folders/route.ts` | Debug pastas IMAP | Completo — lista todas as pastas |
| `src/app/api/delete-email/route.ts` | Apagar emails | 5-27 (fallback pastas), 91 (trash folders) |
| `src/app/api/archive-email/route.ts` | Arquivar emails | 5-27 (fallback pastas) |

---

## ✅ CONCLUSÃO PARA DECISÃO AMANHÃ

**O problema não é na leitura de emails, é na LISTAGEM DE PASTAS.**

A API já sabe detectar pastas corretamente. O painel admin simplesmente não pergunta "quais pastas existem?" — assume que são sempre INBOX/Sent/Trash.

**Solução mais simples:** Fazer o painel perguntar ao servidor quais pastas existem, em vez de assumir.

---

**Preparado por:** Cascade  
**Data:** 21/04/2026 23:50  
**Para revisão conjunta amanhã**
