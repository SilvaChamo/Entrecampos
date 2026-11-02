import type { NextRequest } from 'next/server';

export const googleRedirectUri = (req: NextRequest) =>
  `${process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin}/api/auth/google/callback`;
