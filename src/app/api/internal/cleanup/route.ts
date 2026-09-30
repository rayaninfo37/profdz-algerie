import { NextResponse } from 'next/server';

/**
 * Internal cron-style cleanup endpoint.
 * Called by: vercel cron, uptime monitor, or any authenticated admin request.
 * Protected by CRON_SECRET header.
 * Idempotent — safe to call multiple times.
 */
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Accept from internal callers with secret, or from admin session
  const secret = request.headers.get('x-cron-secret');
  const validSecret = process.env.CRON_SECRET || 'internal-cleanup-dev';

  if (secret !== validSecret) {
    // Also accept unauthenticated on localhost for dev
    const host = request.headers.get('host') || '';
    if (!host.startsWith('localhost') && !host.startsWith('127.')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const { prisma } = await import('@/lib/db');
  const now = new Date();
  const cutoff168h = new Date(now.getTime() - 168 * 60 * 60 * 1000);

  const { count } = await prisma.auditLog.deleteMany({
    where: {
      category: 'LOGIN_ACTIVITY',
      createdAt: { lt: cutoff168h },
    },
  });

  // Reconcile expired PRO subscriptions
  const expiredSubs = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: now },
    },
    include: {
      teacher: {
        include: {
          user: { select: { isFrozen: true } },
        },
      },
    },
  });

  let expiredSubsCount = 0;
  if (expiredSubs.length > 0) {
    const { getPlatformTrialDuration } = await import('@/lib/reach');
    const trialDays = await getPlatformTrialDuration();

    for (const sub of expiredSubs) {
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
      });

      if (sub.teacher) {
        // If teacher is administratively frozen, do not overwrite their FROZEN state
        if (!sub.teacher.user?.isFrozen) {
          const trialExpiresAt = new Date(sub.teacher.createdAt.getTime() + trialDays * 24 * 60 * 60 * 1000);
          const newState = trialExpiresAt > now ? 'FREE_ACTIVE' : 'PRO_EXPIRED';
          await prisma.teacherProfile.update({
            where: { id: sub.teacher.id },
            data: { subscriptionState: newState },
          });
        }
      }
      expiredSubsCount++;
    }

    const { invalidateRankingCache } = await import('@/lib/ranking');
    invalidateRankingCache();
  }

  return NextResponse.json({
    success: true,
    deletedAuditLogs: count,
    reconciledExpiredSubscriptions: expiredSubsCount,
    cutoff: cutoff168h.toISOString(),
    ts: now.toISOString(),
  });
}
