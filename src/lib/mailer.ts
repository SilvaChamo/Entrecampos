import nodemailer from 'nodemailer';

/**
 * E-mail do EntreCAMPOS. Usa o mesmo servidor SMTP (Brevo) do Visualdesign, mas com remetente e modelos próprios:
 * nada de páginas ou textos do Visualdesign. Variáveis: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SITE_EMAIL_FROM.
 */
export function mailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  if (!mailConfigured()) throw new Error('SMTP não configurado.');
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    connectionTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transport.sendMail({ from: process.env.SITE_EMAIL_FROM || 'EntreCAMPOS <noreply@entrecamposblog.com>', to, subject, html, text });
}

const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Modelo do e-mail de recuperação de palavra-passe (identidade EntreCAMPOS). */
export function recoveryEmail(link: string) {
  const safe = esc(link);
  return {
    subject: 'EntreCAMPOS — criar nova palavra-passe',
    text: `Recebemos um pedido para criar uma nova palavra-passe na sua conta EntreCAMPOS.\n\nAbra esta ligação (válida durante 1 hora):\n${link}\n\nSe não fez este pedido, ignore este e-mail: a sua palavra-passe não muda.\n\n— EntreCAMPOS · Agricultura Sustentável em Moçambique`,
    html: `<!doctype html><html lang="pt"><body style="margin:0;background:#f0f0f1;font-family:Arial,Helvetica,sans-serif;color:#2c3338">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-top:4px solid #d6101c">
<tr><td style="background:#0c1f08;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold">Entre<span style="color:#39ff14">CAMPOS</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:20px;color:#1a3d0c">Criar nova palavra-passe</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6">Recebemos um pedido para criar uma nova palavra-passe na sua conta. Clique no botão para continuar. A ligação é válida durante 1 hora.</p>
<p style="margin:0 0 24px"><a href="${safe}" style="background:#d6101c;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 24px;display:inline-block">Criar nova palavra-passe</a></p>
<p style="margin:0 0 6px;font-size:12px;color:#646970">Se o botão não abrir, copie esta ligação para o navegador:</p>
<p style="margin:0 0 20px;font-size:12px;word-break:break-all"><a href="${safe}" style="color:#2271b1">${safe}</a></p>
<p style="margin:0;font-size:12px;color:#646970">Se não fez este pedido, ignore este e-mail: a sua palavra-passe não muda.</p>
</td></tr>
<tr><td style="background:#f6f7f7;padding:14px 28px;font-size:11px;color:#646970">EntreCAMPOS · Agricultura Sustentável em Moçambique</td></tr>
</table></td></tr></table></body></html>`,
  };
}
