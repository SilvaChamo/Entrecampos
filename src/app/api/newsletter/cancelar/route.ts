import { NextRequest, NextResponse } from 'next/server';
import { removeSubscriber, validUnsubscribeToken } from '@/lib/newsletter';

export const dynamic = 'force-dynamic';

const page = (title: string, text: string, status = 200) =>
  new NextResponse(
    `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title></head>
<body style="margin:0;background:#f0f0f1;font-family:Arial,Helvetica,sans-serif;color:#2c3338"><div style="max-width:480px;margin:60px auto;background:#fff;border-top:4px solid #d6101c;padding:28px">
<div style="font-size:20px;font-weight:bold;color:#0c1f08;margin-bottom:14px">Entre<span style="color:#037e02">CAMPOS</span></div>
<h1 style="font-size:18px;margin:0 0 10px">${title}</h1><p style="font-size:14px;line-height:1.6;margin:0 0 18px">${text}</p>
<a href="/" style="color:#d6101c;font-weight:bold;font-size:14px">Voltar ao site</a></div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );

/** Ligação "Cancelar subscrição" dos e-mails: só funciona com o código certo para esse e-mail. */
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get('e') || '').trim().toLowerCase();
  const token = req.nextUrl.searchParams.get('t') || '';
  if (!email || !validUnsubscribeToken(email, token)) return page('Ligação inválida', 'Esta ligação para cancelar a subscrição não é válida.', 400);
  try {
    await removeSubscriber({ email });
    return page('Subscrição cancelada', 'Deixou de receber a newsletter do EntreCAMPOS. Pode voltar a subscrever quando quiser.');
  } catch {
    return page('Não foi possível cancelar', 'Tente mais tarde, por favor.', 500);
  }
}
