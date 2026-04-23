# Plano de Implementação - Fix Emails Painel Admin (visualdesign)

## Objetivo
Corrigir listagem de pastas no painel admin para mostrar todas as pastas reais do servidor IMAP, não apenas INBOX/Sent/Trash hardcoded.

## ⚠️ NOTA IMPORTANTE
Este plano é para o projeto **visualdesign**, que precisa estar aberto no IDE para implementação.

---

## Tarefas para Implementação

---

### ✅ TAREFA 1: Modificar API read-emails para retornar pastas
**Arquivo:** `visualdesign/src/app/api/read-emails/route.ts`

**Ações:**
1. No final da função POST (antes do return), adicionar:
   ```typescript
   // Listar todas as pastas disponíveis
   const allFoldersList = await client.list()
   const availableFolders = allFoldersList.map((mb: any) => mb.path)
   ```

2. Modificar o return final (linha 331) para incluir pastas:
   ```typescript
   return NextResponse.json({ 
     success: true, 
     emails: emails.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()), 
     total: emails.length, 
     folderTotals,
     folders: availableFolders // NOVO
   })
   ```

**Verificação:** Testar API com curl/Postman — deve retornar array `folders`

---

### ✅ TAREFA 2: Criar função de mapeamento de nomes amigáveis
**Arquivo:** `visualdesign/src/app/admin/emails/[email]/page.tsx`

**Ações:**
1. Adicionar função de tradução (antes do componente):
   ```typescript
   const getFolderDisplayName = (folderPath: string): string => {
     const displayNames: Record<string, string> = {
       'INBOX': 'Caixa de Entrada',
       'INBOX.Sent': 'Enviados',
       'Sent': 'Enviados',
       'INBOX.Trash': 'Lixo',
       'Trash': 'Lixo',
       'INBOX.Drafts': 'Rascunhos',
       'Drafts': 'Rascunhos',
       'INBOX.Archive': 'Arquivo',
       'Archive': 'Arquivo',
       'INBOX.Junk': 'Spam',
       'Junk': 'Spam',
       'INBOX.Spam': 'Spam',
       'Spam': 'Spam',
     }
     return displayNames[folderPath] || folderPath
   }
   ```

---

### ✅ TAREFA 3: Atualizar estado inicial para usar pastas da API
**Arquivo:** `visualdesign/src/app/admin/emails/[email]/page.tsx`

**Ações:**
1. Modificar useState inicial (linha 27):
   ```typescript
   // Antes: hardcoded
   // const [folders, setFolders] = useState<string[]>(['INBOX', 'Sent', 'Trash'])
   
   // Depois: vazio inicial, preenchido pela API
   const [folders, setFolders] = useState<string[]>([])
   ```

2. Atualizar o useEffect que carrega emails (linha 75-77):
   ```typescript
   if (data.success) {
     // ... código existente de mapeamento de emails ...
     
     // Atualizar pastas dinamicamente
     if (data.folders && Array.isArray(data.folders)) {
       setFolders(data.folders)
       console.log('📁 Pastas carregadas:', data.folders)
     }
   }
   ```

---

### ✅ TAREFA 4: Atualizar renderização das pastas na sidebar
**Arquivo:** `visualdesign/src/app/admin/emails/[email]/page.tsx`

**Ações:**
1. Modificar o map de folders (linha 130-150) para usar função de tradução:
   ```typescript
   {folders.map(folder => (
     <button
       key={folder}
       onClick={() => setSelectedFolder(folder)}
       className={`...`}
     >
       {/* Ícone baseado na pasta */}
       {folder === 'INBOX' && <Inbox className="w-4 h-4" />}
       {(folder === 'Sent' || folder === 'INBOX.Sent') && <Send className="w-4 h-4" />}
       {(folder === 'Trash' || folder === 'INBOX.Trash') && <Trash2 className="w-4 h-4" />}
       {(folder === 'Drafts' || folder === 'INBOX.Drafts') && <FileText className="w-4 h-4" />}
       {(folder === 'Archive' || folder === 'INBOX.Archive') && <Archive className="w-4 h-4" />}
       {(folder === 'Junk' || folder === 'INBOX.Junk' || folder === 'Spam' || folder === 'INBOX.Spam') && <AlertTriangle className="w-4 h-4" />}
       {!['INBOX', 'Sent', 'INBOX.Sent', 'Trash', 'INBOX.Trash', 'Drafts', 'INBOX.Drafts', 'Archive', 'INBOX.Archive', 'Junk', 'INBOX.Junk', 'Spam', 'INBOX.Spam'].includes(folder) && <Mail className="w-4 h-4" />}
       
       {/* Nome traduzido */}
       <span className="text-sm font-medium">
         {getFolderDisplayName(folder)}
       </span>
     </button>
   ))}
   ```

2. Adicionar imports necessários (linha 5):
   ```typescript
   import { Mail, ArrowLeft, RefreshCw, Inbox, Send, Trash2, AlertCircle, FileText, Archive, AlertTriangle } from 'lucide-react'
   ```

---

### ✅ TAREFA 5: Adicionar loading state para pastas
**Arquivo:** `visualdesign/src/app/admin/emails/[email]/page.tsx`

**Ações:**
1. Adicionar estado de loading para pastas:
   ```typescript
   const [foldersLoading, setFoldersLoading] = useState(true)
   ```

2. Atualizar loadEmails para gerenciar loading de pastas:
   ```typescript
   if (data.folders && Array.isArray(data.folders)) {
     setFolders(data.folders)
     setFoldersLoading(false)
   }
   ```

3. Mostrar skeleton/loading na sidebar enquanto carrega:
   ```typescript
   {foldersLoading ? (
     <div className="space-y-1">
       {[...Array(3)].map((_, i) => (
         <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />
       ))}
     </div>
   ) : (
     folders.map(folder => (...))
   )}
   ```

---

### ✅ TAREFA 6: Adicionar contagem de não-lidos (badge)
**Arquivo:** `visualdesign/src/app/admin/emails/[email]/page.tsx`

**Ações:**
1. Receber folderTotals da API (já está sendo retornado):
   ```typescript
   if (data.folderTotals) {
     setFolderUnreadCounts(data.folderTotals)
   }
   ```

2. Adicionar estado:
   ```typescript
   const [folderUnreadCounts, setFolderUnreadCounts] = useState<Record<string, number>>({})
   ```

3. Mostrar badge com contagem:
   ```typescript
   <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
     {folderUnreadCounts[folder] || 0}
   </span>
   ```

---

### ✅ TAREFA 7: Testar com conta real
**Ações:**
1. Acessar painel admin: `/admin?page=webmail`
2. Clicar numa conta de email
3. Verificar se aparecem todas as pastas do servidor
4. Testar clique em cada pasta
5. Verificar se emails aparecem corretamente

---

## Ordem de Execução
1 → 2 → 3 → 4 → 5 → 6 → 7

## Critérios de Sucesso
- [ ] Sidebar mostra todas as pastas do servidor (não só 3)
- [ ] Nomes amigáveis em português (Arquivo, Rascunhos, Spam)
- [ ] Ícones diferentes para cada tipo de pasta
- [ ] Badge com contagem de não-lidos
- [ ] Clique em pasta carrega emails corretos
- [ ] Sem erros no console

## Ficheiros a Modificar
1. `visualdesign/src/app/api/read-emails/route.ts` (T1)
2. `visualdesign/src/app/admin/emails/[email]/page.tsx` (T2, T3, T4, T5, T6)

---

**Criado por:** Cascade  
**Data:** 22/04/2026  
**Status:** Aguardando implementação
