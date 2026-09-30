import { prisma } from './db';
import { SubscriptionState } from '@/types';
import { getPlatformSettings } from './config';

export async function getPlatformTrialDuration(): Promise<number> {
  const settings = await getPlatformSettings();
  return settings.TRIAL_DURATION_DAYS;
}

export async function recordProfileView(teacherId: string, viewerUserId?: string | null) {
  if (!viewerUserId || !teacherId) return;

  const teacher = await prisma.teacherProfile.findUnique({
    where: { id: teacherId },
    select: { id: true, userId: true, subscriptionState: true },
  });

  if (!teacher) return;
  // Ignore self-views by the teacher on their own profile
  if (teacher.userId === viewerUserId) return;

  try {
    // Record unique reach event (1 per registered viewer) for analytics
    await prisma.reachEvent.create({
      data: {
        teacherId,
        viewerUserId,
      },
    });
  } catch (error: any) {
    // P2002 means already viewed by this user, ignore
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

