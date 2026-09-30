import { NextResponse } from 'next/server';

/**
 * In-memory rate limiter per IP.
 * For GET requests: more lenient (default 60/min).
 * For POST/PUT/PATCH/DELETE: stricter (default 20/min, configurable per route).
 */
const store = new Map<string, { count: number; resetAt: number }>();

// Periodically clean stale entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store.entries()) {
    if (val.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000); // every 5 minutes

export async function rateLimit(
  request: Request,
  limit?: number,
  windowMs: number = 60_000,
): Promise<NextResponse | null> {
  const method = request.method?.toUpperCase() ?? 'GET';

  // Default limit by method if not explicitly provided
  const effectiveLimit = limit !== undefined
    ? limit
    : method === 'GET' ? 120 : 20; // GET = 120/min, mutating = 20/min

  const ip = (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  ).substring(0, 45);

  const key = `${ip}:${method}:${new URL(request.url).pathname}`;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null; // OK
  }

  entry.count += 1;

  if (entry.count > effectiveLimit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return NextResponse.json(
      { error: 'Too many requests. Please wait before trying again.', retryAfter },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(effectiveLimit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  return null; // OK
}
