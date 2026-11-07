import { NextRequest, NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { cookieOptions, SESSION_COOKIE, signSession } from '@/lib/local-session';
import { mapRole } from '@/lib/auth';
import { serverDb } from '@/lib/antispam';
import { siteAccess, withSiteAccess, effectiveRole } from '@/lib/site-accounts';
import { googleRedirectUri } from '@/lib/google-oauth';

const fail = (req: NextRequest, code: string) => {
  const res = NextResponse.redirect(new URL(`/login?erro=${code}`, req.url));
  res.cookies.delete('ec_google_state');
  return res;
};

/** Regresso do Google: confirma o código, identifica a conta pelo e-mail verificado e abre a sessão do EntreCAMPOS. */
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const state = req.nextUrl.searchParams.get('state');
    if (!code || !state || state !== req.cookies.get('ec_google_state')?.value) return fail(req, 'google');

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: googleRedirectUri(req),
        grant_type: 'authorization_code',
      }),
    });
    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokenRes.ok || !tokens.access_token) return fail(req, 'google');

    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const info = (await infoRes.json()) as { email?: string; email_verified?: boolean; name?: string; picture?: string };
    if (!infoRes.ok || !info.email || !info.email_verified) return fail(req, 'google');
    const email = info.email.toLowerCase();

    const db = serverDb();
    let user: User | null = null;
    for (let page = 1; page <= 10 && !user; page++) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data) break;
      user = data.users.find((u) => (u.email || '').toLowerCase() === email) ?? null;
      if (data.users.length < 1000) break;
    }

    if (!user) {
      const { data, error } = await db.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: info.name, avatar_url: info.picture },
        app_metadata: { entrecampos: { role: 'Subscritor', approved: true } },
      });
      if (error || !data.user) return fail(req, 'google');
      user = data.user;
    }

    let access = siteAccess(user);
    if (!access) {
      const { data, error } = await db.auth.admin.updateUserById(user.id, {
        app_metadata: withSiteAccess(user, { role: 'Subscritor', approved: true }),
      });
      if (error || !data.user) return fail(req, 'google');
      user = data.user;
      access = siteAccess(user);
    }
    if (!access?.approved) return fail(req, 'suspensa');

    const meta = user.user_metadata || {};
    const payload = { id: user.id, email, name: String(meta.full_name || meta.name || info.name || email.split('@')[0]), role: mapRole(effectiveRole(access)), colunista: /^colunista$/i.test(access.role) };
    const res = NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin));
    res.cookies.set(SESSION_COOKIE, signSession(payload), cookieOptions());
    res.cookies.delete('ec_google_state');
    return res;
  } catch {
    return fail(req, 'google');
  }
}
