import { ImapFlow } from 'imapflow';
import sharp from 'sharp';
import { classify } from '@/lib/partilhado-tipos';

/**
 * Caixa de correio da redacção (IMAP), só para LER anexos partilhados.
 * A caixa é aberta em modo só de leitura: nunca se apaga, move nem marca nada no e-mail.
 */

export type MailAttachment = {
  part: string;
  filename: string;
  contentType: string;
  size: number;
};

export type MailWithFiles = {
  uid: number;
  from: string;
  subject: string;
  date: string;
  files: MailAttachment[];
};

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const MAX_MESSAGES = 60;

export const mailConfigured = () => Boolean(process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASS);

export const mailAddress = () => process.env.IMAP_USER || 'redaccao@entrecamposblog.com';

function newClient() {
  return new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT || 993),
    secure: (process.env.IMAP_SECURE ?? 'true') !== 'false',
    auth: { user: process.env.IMAP_USER!, pass: process.env.IMAP_PASS! },
    logger: false,
    socketTimeout: 30_000,
  });
}

/** Abre a ligação, corre a tarefa e fecha sempre. */
async function withMailbox<T>(task: (client: ImapFlow) => Promise<T>): Promise<T> {
  if (!mailConfigured()) throw new Error('O e-mail da redacção ainda não está configurado (IMAP_HOST, IMAP_USER, IMAP_PASS).');
  const client = newClient();
  client.on('error', () => {});
  await client.connect();
  const lock = await client.getMailboxLock(process.env.IMAP_FOLDER || 'INBOX', { readOnly: true });
  try {
    return await task(client);
  } finally {
    lock.release();
    await client.logout().catch(() => {});
  }
}

type StructureNode = {
  part?: string;
  type?: string;
  size?: number;
  disposition?: string;
  dispositionParameters?: Record<string, string>;
  parameters?: Record<string, string>;
  childNodes?: StructureNode[];
};

function collectFiles(node: StructureNode | undefined, out: MailAttachment[] = []) {
  if (!node) return out;
  if (node.childNodes?.length) node.childNodes.forEach((c) => collectFiles(c, out));
  else if (node.type && node.part) {
    const name = node.dispositionParameters?.filename || node.parameters?.name || '';
    // Só anexos que têm pasta (imagens, PDF, ZIP, documentos); ignora imagens embebidas na assinatura (sem nome e pequenas).
    if (classify(node.type, name || `x.${node.type.split('/')[1]}`) && (name || (node.size ?? 0) > 60_000)) {
      out.push({
        part: node.part,
        filename: name || `imagem-${node.part}.${node.type.split('/')[1]}`,
        contentType: node.type.toLowerCase(),
        size: node.size ?? 0,
      });
    }
  }
  return out;
}

/** Últimas mensagens que trazem fotos/ficheiros, mais recentes primeiro. */
export async function listMailFiles(): Promise<MailWithFiles[]> {
  return withMailbox(async (client) => {
    const total = (client.mailbox && typeof client.mailbox === 'object' ? client.mailbox.exists : 0) || 0;
    if (!total) return [];
    const from = Math.max(1, total - 199);
    const found: MailWithFiles[] = [];
    for await (const msg of client.fetch(`${from}:*`, { uid: true, envelope: true, bodyStructure: true })) {
      const files = collectFiles(msg.bodyStructure as StructureNode).filter((f) => f.size <= MAX_FILE_BYTES);
      if (!files.length) continue;
      found.push({
        uid: msg.uid,
        from: msg.envelope?.from?.[0]?.name || msg.envelope?.from?.[0]?.address || '',
        subject: msg.envelope?.subject || '(sem assunto)',
        date: (msg.envelope?.date ? new Date(msg.envelope.date) : new Date()).toISOString(),
        files,
      });
    }
    return found.sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_MESSAGES);
  });
}

/** Descarrega um anexo (uid + parte) para memória. */
export async function downloadMailFile(uid: number, part: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
  if (!/^\d+(\.\d+)*$/.test(part)) throw new Error('Parte inválida.');
  return withMailbox(async (client) => {
    const info = await client.fetchOne(String(uid), { bodyStructure: true }, { uid: true });
    const file = info && collectFiles(info.bodyStructure as StructureNode).find((f) => f.part === part);
    if (!file) throw new Error('Ficheiro não encontrado no e-mail.');
    if (file.size > MAX_FILE_BYTES) throw new Error('Ficheiro demasiado grande.');
    const dl = await client.download(String(uid), part, { uid: true });
    if (!dl?.content) throw new Error('Não foi possível descarregar o ficheiro.');
    const { content, meta } = dl;
    const chunks: Buffer[] = [];
    for await (const chunk of content) chunks.push(Buffer.from(chunk));
    return { buffer: Buffer.concat(chunks), contentType: meta?.contentType || file.contentType, filename: file.filename };
  });
}

/** Miniatura leve (JPEG 480px) para a grelha; não-imagens devolvem null. */
export async function thumbnail(buffer: Buffer, contentType: string) {
  if (!contentType.startsWith('image/') || contentType === 'image/gif') return null;
  return sharp(buffer).rotate().resize(480, 480, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer();
}

/** Optimiza a foto para a web: roda pela orientação EXIF, máx. 2400px, sem metadados. */
export async function optimizeImage(buffer: Buffer, contentType: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (!contentType.startsWith('image/') || contentType === 'image/gif' || contentType === 'image/avif') {
    return { buffer, contentType, ext: contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1] };
  }
  const img = sharp(buffer).rotate().resize(2400, 2400, { fit: 'inside', withoutEnlargement: true });
  if (contentType === 'image/png') return { buffer: await img.png({ compressionLevel: 9 }).toBuffer(), contentType, ext: 'png' };
  if (contentType === 'image/webp') return { buffer: await img.webp({ quality: 82 }).toBuffer(), contentType, ext: 'webp' };
  return { buffer: await img.jpeg({ quality: 82, mozjpeg: true }).toBuffer(), contentType: 'image/jpeg', ext: 'jpg' };
}

export type MailForImport = {
  uid: number;
  messageId: string;
  fromAddress: string;
  from: string;
  subject: string;
  date: string;
  /** Resultado da verificação do remetente feita pelo servidor de e-mail (SPF/DKIM), se o houver. */
  auth: string;
  files: MailAttachment[];
};

/** Últimas mensagens com anexos (para importar notícias de documentos Word), com remetente e verificação do servidor. Só lê. */
export async function listMailForImport(limit = 40): Promise<MailForImport[]> {
  return withMailbox(async (client) => {
    const total = (client.mailbox && typeof client.mailbox === 'object' ? client.mailbox.exists : 0) || 0;
    if (!total) return [];
    const from = Math.max(1, total - limit + 1);
    const found: MailForImport[] = [];
    for await (const msg of client.fetch(`${from}:*`, { uid: true, envelope: true, bodyStructure: true, headers: ['authentication-results'] })) {
      const files = collectFiles(msg.bodyStructure as StructureNode).filter((f) => f.size <= MAX_FILE_BYTES);
      if (!files.length) continue;
      const sender = msg.envelope?.from?.[0];
      found.push({
        uid: msg.uid,
        messageId: msg.envelope?.messageId || `uid-${msg.uid}`,
        fromAddress: (sender?.address || '').toLowerCase(),
        from: sender?.name || sender?.address || '',
        subject: msg.envelope?.subject || '(sem assunto)',
        date: (msg.envelope?.date ? new Date(msg.envelope.date) : new Date()).toISOString(),
        auth: msg.headers ? Buffer.from(msg.headers).toString('utf8').replace(/\s+/g, ' ').trim() : '',
        files,
      });
    }
    return found.sort((a, b) => a.date.localeCompare(b.date));
  });
}
