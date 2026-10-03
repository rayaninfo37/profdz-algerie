import { prisma } from '@/lib/db';

const recentViewCache = new Map<string, number>();

/**
 * Record a truthful, deduplicated profile view.
 * Deduplicates views by targetId and viewerId within a 1-hour rolling window.
 * Uses an in-memory lock map to prevent concurrent race conditions on rapid page loads.
 */
export async function recordProfileView(
  targetId: string,
  targetType: 'TEACHER' | 'INSTITUTION',
  viewerId?: string | null,
  ipHash?: string | null
): Promise<void> {
  const viewerKey = viewerId ? `u:${viewerId}` : ipHash ? `ip:${ipHash}` : null;
  if (!viewerKey) return;

  const cacheKey = `${targetType}:${targetId}:${viewerKey}`;
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;

  // Immediate synchronous in-memory check to prevent concurrency race
  const cachedTime = recentViewCache.get(cacheKey);
  if (cachedTime && now - cachedTime < ONE_HOUR) {
    return;
  }
  // Claim the view slot in memory immediately before async DB calls
  recentViewCache.set(cacheKey, now);

  // Prune expired cache keys if map grows large
  if (recentViewCache.size > 10000) {
    for (const [k, v] of recentViewCache.entries()) {
      if (now - v > ONE_HOUR) recentViewCache.delete(k);
    }
  }

  try {
    const oneHourAgo = new Date(now - ONE_HOUR);

    // Check DB for recent view (cross-instance deduplication)
    if (viewerId) {
      const recentView = await prisma.profileView.findFirst({
        where: {
          targetId,
          targetType,
          viewerId,
          createdAt: { gte: oneHourAgo },
        },
        select: { id: true },
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
        select: { id: true },
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
