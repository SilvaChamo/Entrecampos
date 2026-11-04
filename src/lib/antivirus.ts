import net from 'net';

/**
 * Análise com ClamAV (clamd) pelo protocolo INSTREAM.
 * Configurar CLAMD_URL (+ CLAMD_TOKEN): ponte HTTPS protegida no servidor, o caminho para a Vercel;
 * ou CLAMD_HOST (+ CLAMD_PORT, por defeito 3310); ou CLAMD_SOCKET (ex.: /var/run/clamav/clamd.ctl,
 * quando a aplicação corre no próprio servidor).
 */
export type ScanResult = { status: 'clean' } | { status: 'infected'; signature: string } | { status: 'unavailable'; reason: string };

export const antivirusConfigured = () => Boolean(process.env.CLAMD_URL || process.env.CLAMD_HOST || process.env.CLAMD_SOCKET);

async function scanViaGateway(data: Buffer, timeoutMs: number): Promise<ScanResult> {
  try {
    const res = await fetch(process.env.CLAMD_URL!, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.CLAMD_TOKEN || ''}`, 'Content-Type': 'application/octet-stream' },
      body: new Uint8Array(data),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return { status: 'unavailable', reason: `ponte do antivírus respondeu ${res.status}` };
    const body = (await res.json()) as { status?: string; signature?: string };
    if (body.status === 'clean') return { status: 'clean' };
    if (body.status === 'infected') return { status: 'infected', signature: body.signature || 'desconhecido' };
    return { status: 'unavailable', reason: 'resposta inválida do antivírus' };
  } catch (err) {
    return { status: 'unavailable', reason: err instanceof Error ? err.message : 'falha na ponte do antivírus' };
  }
}

export function scanBuffer(data: Buffer, timeoutMs = 60_000): Promise<ScanResult> {
  if (process.env.CLAMD_URL) return scanViaGateway(data, timeoutMs);
  return new Promise((resolve) => {
    const socket = process.env.CLAMD_SOCKET
      ? net.createConnection({ path: process.env.CLAMD_SOCKET })
      : net.createConnection({ host: process.env.CLAMD_HOST!, port: Number(process.env.CLAMD_PORT || 3310) });
    let reply = '';
    let done = false;
    const finish = (r: ScanResult) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve(r);
    };
    socket.setTimeout(timeoutMs, () => finish({ status: 'unavailable', reason: 'tempo esgotado' }));
    socket.on('error', (err) => finish({ status: 'unavailable', reason: err.message }));
    socket.on('data', (chunk) => { reply += chunk.toString('utf8'); });
    socket.on('end', () => {
      const text = reply.replace(/\0/g, '').trim();
      if (/\bOK$/.test(text)) return finish({ status: 'clean' });
      const found = /^stream:\s*(.+?)\s+FOUND$/.exec(text);
      if (found) return finish({ status: 'infected', signature: found[1] });
      finish({ status: 'unavailable', reason: text || 'sem resposta do antivírus' });
    });
    socket.on('connect', () => {
      socket.write('zINSTREAM\0');
      for (let i = 0; i < data.length; i += 64 * 1024) {
        const part = data.subarray(i, i + 64 * 1024);
        const size = Buffer.alloc(4);
        size.writeUInt32BE(part.length);
        socket.write(size);
        socket.write(part);
      }
      socket.write(Buffer.alloc(4));
    });
  });
}
