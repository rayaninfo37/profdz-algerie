import { prisma } from '@/lib/db';
import { SubscriptionState } from '@/types';
import { getPlatformTrialDuration } from '@/lib/reach';
import { invalidateRankingCache } from '@/lib/ranking';

export interface ResolvedTeacherEntitlement {
  teacherId: string;
  userId: string;
  subscriptionState: SubscriptionState;
  isPro: boolean;
  isFrozen: boolean;
  isExpired: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  trialExpiresAt: Date;
  reachCount: number;
  freeLimit: number;
  remainingReach: number;
  activeSubscription: {
    id: string;
    startedAt: Date;
    expiresAt: Date;
    daysRemaining: number;
  } | null;
  pendingProof: {
    id: string;
    status: string;
    createdAt: Date;
    transactionRef?: string | null;
  } | null;
}

/**
 * Authoritative Server-Side Entitlement Resolver
 * 30-Day Free Trial Model:
 * - Free Trial lasts 30 days from profile creation date.
 * - If trial period (30 days) expires and teacher has no active PRO subscription => FROZEN.
 * - FROZEN blocks public discovery & interactions, but preserves teacher login and dashboard access.
 * - If PRO active => PRO_ACTIVE.
 * - If PRO expires and trial also expired => FROZEN.
 * - Uses 30-day trial model exclusively (no viewer reach limit).
 */
export async function resolveTeacherEntitlement(
  teacherId: string
): Promise<ResolvedTeacherEntitlement | null> {
  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: teacherId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { expiresAt: 'desc' },
        take: 1,
      },
      paymentProofs: {
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!teacher) return null;

  const activeSub = teacher.subscriptions[0] || null;
  const now = new Date();
  let currentState = teacher.subscriptionState as SubscriptionState;

  // Calculate Trial window dynamically from platform settings and teacher profile creation
  const trialDurationDays = await getPlatformTrialDuration();
  const trialDurationMs = trialDurationDays * 24 * 60 * 60 * 1000;
  const trialExpiresAt = new Date(teacher.createdAt.getTime() + trialDurationMs);
  const isTrialActive = trialExpiresAt > now;

  if (activeSub) {
    if (activeSub.expiresAt <= now) {
      // Pro subscription expired!
      await prisma.subscription.update({
        where: { id: activeSub.id },
        data: { status: 'EXPIRED' },
      });

      // If trial is still active, return to FREE_ACTIVE, else PRO_EXPIRED
      currentState = isTrialActive ? SubscriptionState.FREE_ACTIVE : SubscriptionState.PRO_EXPIRED;

      await prisma.teacherProfile.update({
        where: { id: teacherId },
        data: { subscriptionState: currentState },
      });

      // Idempotent notification: Send PRO expiration alert once per expired subscription
      try {
        const existingNotif = await prisma.notification.findFirst({
          where: {
            userId: teacher.userId,
            title: 'انتهت صلاحية اشتراك PRO',
            createdAt: { gte: activeSub.expiresAt },
          },
        });

        if (!existingNotif) {
          await prisma.notification.create({
            data: {
              userId: teacher.userId,
              title: 'انتهت صلاحية اشتراك PRO',
              message:
                currentState === SubscriptionState.PRO_EXPIRED
                  ? 'انتهت باقة PRO وانتهت فترة التجربة المجانية (30 يوماً). يرجى تجديد الاشتراك لتفعيل الظهور في المتجر والبحث.'
                  : 'انتهت باقة PRO وعاد الحساب إلى الفترة التجريبية المجانية المتبقية.',
              type: 'SYSTEM',
            },
          });
        }
      } catch (notifErr) {
        console.error('Failed to create subscription expiry notification:', notifErr);
      }
    } else {
      // Actively in PRO
      if (currentState !== SubscriptionState.PRO_ACTIVE) {
        currentState = SubscriptionState.PRO_ACTIVE;
        await prisma.teacherProfile.update({
          where: { id: teacherId },
          data: { subscriptionState: SubscriptionState.PRO_ACTIVE },
        });
      }
    }
  } else {
    // No active subscription: check 30-day trial status
    if (!isTrialActive) {
      if (currentState === SubscriptionState.PRO_ACTIVE) {
        currentState = SubscriptionState.PRO_EXPIRED;
        await prisma.teacherProfile.update({
          where: { id: teacherId },
          data: { subscriptionState: SubscriptionState.PRO_EXPIRED },
        });
      }
    } else if (currentState === SubscriptionState.PRO_EXPIRED) {
      currentState = SubscriptionState.FREE_ACTIVE;
      await prisma.teacherProfile.update({
        where: { id: teacherId },
        data: { subscriptionState: SubscriptionState.FREE_ACTIVE },
      });
    }
  }

  if (currentState !== teacher.subscriptionState) {
    invalidateRankingCache();
  }

  let daysRemaining = 0;
  if (activeSub && activeSub.expiresAt > now) {
    const diffMs = activeSub.expiresAt.getTime() - now.getTime();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const trialDiffMs = trialExpiresAt.getTime() - now.getTime();
  const trialDaysRemaining = Math.max(0, Math.ceil(trialDiffMs / (1000 * 60 * 60 * 24)));

  const latestPendingProof = teacher.paymentProofs[0] || null;

  return {
    teacherId: teacher.id,
    userId: teacher.userId,
    subscriptionState: currentState,
    isPro: currentState === SubscriptionState.PRO_ACTIVE,
    isFrozen: currentState === SubscriptionState.FROZEN,
    isExpired: currentState === SubscriptionState.PRO_EXPIRED,
    isTrialActive,
    trialDaysRemaining,
    trialExpiresAt,
    reachCount: 0,
    freeLimit: trialDurationDays,
    remainingReach: trialDaysRemaining,
    activeSubscription: activeSub
      ? {
          id: activeSub.id,
          startedAt: activeSub.startedAt,
          expiresAt: activeSub.expiresAt,
          daysRemaining,
        }
      : null,
    pendingProof: latestPendingProof
      ? {
          id: latestPendingProof.id,
          status: latestPendingProof.status,
          createdAt: latestPendingProof.createdAt,
          transactionRef: latestPendingProof.transactionRef,
        }
      : null,
  };
}
