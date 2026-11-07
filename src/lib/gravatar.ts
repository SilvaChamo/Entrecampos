import { createHash } from 'crypto';

/**
 * Avatar do e-mail (Gravatar). `d=404`: se o e-mail não tem conta no Gravatar a imagem não existe e quem mostra o avatar
 * passa às iniciais do nome (componente Avatar). Só no servidor.
 */
export function gravatarUrl(email: string | null | undefined, size = 200): string {
  const e = String(email ?? '').trim().toLowerCase();
  if (!e) return '';
  return `https://gravatar.com/avatar/${createHash('sha256').update(e).digest('hex')}?s=${size}&d=404`;
}
