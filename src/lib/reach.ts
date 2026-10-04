import { prisma } from './db';
import { SubscriptionState } from '@/types';
import { getPlatformSettings } from './config';

export async function getPlatformTrialDuration(): Promise<number> {
  const settings = await getPlatformSettings();
  return settings.TRIAL_DURATION_DAYS;
}

const recordedReachCache = new Set<string>();

export async function recordProfileView(teacherId: string, viewerUserId?: string | null) {
  if (!viewerUserId || !teacherId) return;

  const cacheKey = `${teacherId}:${viewerUserId}`;
  if (recordedReachCache.has(cacheKey)) {
    return;
  }

  // Claim in-memory slot immediately to block concurrent duplicate requests
  recordedReachCache.add(cacheKey);
  if (recordedReachCache.size > 20000) {
    recordedReachCache.clear();
  }

  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: teacherId },
    select: { id: true, userId: true },
  });

  if (!teacher || teacher.userId === viewerUserId) return;

  // Non-exception existence check via unique index
  const existing = await prisma.reachEvent.findUnique({
    where: {
      teacherId_viewerUserId: {
        teacherId,
        viewerUserId,
      },
    },
    select: { id: true },
  });

  if (existing) return;

  try {
    await prisma.reachEvent.create({
      data: {
        teacherId,
        viewerUserId,
      },
    });
  } catch (error: any) {
    // Race-condition fallback
  }
}

export async function getTeacherReachStatus(teacherId: string) {
  const { resolveTeacherEntitlement } = await import('./subscriptionEntitlement');
  const entitlement = await resolveTeacherEntitlement(teacherId);
  if (!entitlement) return null;

  return {
    reachCount: entitlement.reachCount,
    freeLimit: entitlement.freeLimit,
    isFrozen: entitlement.isFrozen,
    subscriptionState: entitlement.subscriptionState,
    remainingReach: entitlement.remainingReach,
    activeSubscription: entitlement.activeSubscription,
    pendingProof: entitlement.pendingProof,
  };
}

