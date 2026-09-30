import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@/lib/auth';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request);
  if (limitRes) return limitRes;
  await clearSessionCookie();
  return NextResponse.json({ success: true });
}
