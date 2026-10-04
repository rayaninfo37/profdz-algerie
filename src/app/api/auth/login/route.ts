import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken, setSessionCookie, sanitizeUserForClient } from '@/lib/auth';
import { UserRole } from '@/types';
import { rateLimit } from '@/middleware/rateLimitMiddleware';
import { logAnalyticsEvent } from '@/lib/analytics';

import { validateAlgerianPhone } from '@/lib/algerianPhone';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 10, 60_000);
  if (limitRes) return limitRes;
  try {
    const body = await request.json().catch(() => ({}));
    const rawIdentifier = (body.email || body.phone || body.identifier || '').trim();
    const password = body.password;

    if (!rawIdentifier || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو رقم الهاتف وكلمة المرور مطلوبة.' }, { status: 400 });
    }

    let user = null;
    if (rawIdentifier.includes('@')) {
      user = await prisma.user.findUnique({
        where: { email: rawIdentifier.toLowerCase() },
        include: {
          teacherProfile: true,
          studentProfile: true,
          parentProfile: true,
          institutionProfile: true,
        },
      });
    } else {
      const phoneVal = validateAlgerianPhone(rawIdentifier, false);
      const searchPhone = phoneVal.isValid ? phoneVal.normalizedPhone : rawIdentifier;
      user = await prisma.user.findFirst({
        where: { phone: searchPhone },
        include: {
          teacherProfile: true,
          studentProfile: true,
          parentProfile: true,
          institutionProfile: true,
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'بيانات الدخول غير صحيحة.' }, { status: 401 });
    }

    // Check soft-deleted
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه. تواصل مع الإدارة للاستفسار.' }, { status: 403 });
    }

    // Check frozen
    if (user.isFrozen) {
      return NextResponse.json({ error: 'تم تجميد هذا الحساب من قبل الإدارة. تواصل مع الدعم.' }, { status: 403 });
    }

    // Check email verified
    if (!user.isEmailVerified) {
      return NextResponse.json({ error: 'يرجى تأكيد بريدك الإلكتروني أولاً لتفعيل الحساب.' }, { status: 403 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Extract request metadata for audit
    const ip = (
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    ).substring(0, 45);
    const userAgent = (request.headers.get('user-agent') || 'unknown').substring(0, 250);

    const isFirstLogin = !user.firstLoginAt;

    if (isFirstLogin) {
      // Set first login info ONCE — never overwrite
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstLoginAt: new Date(),
          firstLoginIp: ip,
          firstLoginAgent: userAgent,
        },
      });
      // Permanent audit record for first login
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'FIRST_LOGIN',
          target: user.id,
          category: 'LOGIN_FIRST',
          details: 'First login recorded',
        },
      });
    } else {
      // Transient login activity — cleaned up after 168h
      await prisma.auditLog.create({
        data: {
          actorId: user.id,
          action: 'LOGIN',
          target: user.id,
          category: 'LOGIN_ACTIVITY',
          details: JSON.stringify({ role: user.role }),
        },
      });
    }

    // Idempotent background cleanup — delete LOGIN_ACTIVITY older than 168h
    // Fire-and-forget: never blocks login
    prisma.auditLog.deleteMany({
      where: {
        category: 'LOGIN_ACTIVITY',
        createdAt: { lt: new Date(Date.now() - 168 * 60 * 60 * 1000) },
      },
    }).catch(() => {}); // ignore errors silently

    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      fullName: user.fullName,
    });

    await setSessionCookie(token);

    // Analytics: track successful login (no sensitive data)
    logAnalyticsEvent({ type: 'LOGIN', userId: user.id, metadata: { role: user.role } });

    return NextResponse.json({
      success: true,
      user: sanitizeUserForClient(user),
    });
  } catch (error: any) {
    console.error('[LOGIN] Error:', error?.message);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}
