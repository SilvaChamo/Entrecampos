import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, sessionToUser, verifySession } from '@/lib/local-session';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const payload = verifySession(token);
  if (!payload) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user: sessionToUser(payload) });
}
