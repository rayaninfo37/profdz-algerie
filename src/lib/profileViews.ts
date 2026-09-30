import { prisma } from '@/lib/db';

/**
 * Record a truthful, deduplicated profile view.
 * Deduplicates views by targetId and viewerId within a 1-hour rolling window.
 */
export async function recordProfileView(
  targetId: string,
  targetType: 'TEACHER' | 'INSTITUTION',
  viewerId?: string | null,
  ipHash?: string | null
): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    // Check recent view
    if (viewerId) {
      const recentView = await prisma.profileView.findFirst({
        where: {
          targetId,
          targetType,
          viewerId,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recentView) return;
    } else if (ipHash) {
      const recentView = await prisma.profileView.findFirst({
        where: {
          targetId,
          targetType,
          ipHash,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recentView) return;
    }

    await prisma.profileView.create({
      data: {
        targetId,
        targetType,
        viewerId: viewerId || null,
        ipHash: ipHash || null,
      },
    });
  } catch (error) {
    console.error('Failed to record profile view:', error);
  }
}

/**
 * Get accurate count of profile views
 */
export async function getProfileViewCount(
  targetId: string,
  targetType: 'TEACHER' | 'INSTITUTION' = 'TEACHER'
): Promise<number> {
  try {
    return await prisma.profileView.count({
      where: { targetId, targetType },
    });
  } catch {
    return 0;
  }
}
