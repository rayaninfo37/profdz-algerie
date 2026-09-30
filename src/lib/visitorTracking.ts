import { prisma } from '@/lib/db';
import crypto from 'crypto';

export interface ProfileVisitorInfo {
  id: string;
  visitorId?: string | null;
  visitorName: string;
  visitorRole: string;
  visitorAvatar?: string | null;
  visitorProfileUrl?: string | null;
  visitedAt: Date;
  relativeTimeStr: string;
}

export interface ProductVisitorInfo {
  id: string;
  visitorId?: string | null;
  visitorName: string;
  visitorRole: string;
  visitorAvatar?: string | null;
  viewedAt: Date;
  relativeTimeStr: string;
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffSec = Math.floor((now - date.getTime()) / 1000);

  if (diffSec < 60) return 'منذ لحظات';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  const diffDays = Math.floor(diffHours / 24);
  return `منذ ${diffDays} يوم`;
}

/**
 * Record a truthful deduplicated profile view for any persona
 */
export async function recordProfileVisitor(
  targetId: string,
  targetType: string, // TEACHER, STUDENT, PARENT, INSTITUTION, ACADEMIC, ASSISTANT
  viewerUserId?: string | null,
  ipHash?: string | null
): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (viewerUserId) {
      // Ignore self-views
      const targetUser = await prisma.user.findFirst({
        where: {
          OR: [
            { id: targetId },
            { teacherProfile: { id: targetId } },
            { studentProfile: { id: targetId } },
            { parentProfile: { id: targetId } },
            { institutionProfile: { id: targetId } },
          ],
        },
        select: { id: true },
      });

      if (targetUser && targetUser.id === viewerUserId) return;

      const recent = await prisma.profileView.findFirst({
        where: {
          targetId,
          targetType,
          viewerId: viewerUserId,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recent) return;
    } else if (ipHash) {
      const recent = await prisma.profileView.findFirst({
        where: {
          targetId,
          targetType,
          ipHash,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recent) return;
    }

    await prisma.profileView.create({
      data: {
        targetId,
        targetType,
        viewerId: viewerUserId || null,
        ipHash: ipHash || null,
      },
    });
  } catch (error) {
    console.error('Failed to record profile view:', error);
  }
}

/**
 * Get full list of known visitors for profile owner dashboard
 */
export async function getProfileVisitors(
  targetId: string,
  targetType: string = 'TEACHER',
  limit: number = 20
): Promise<{ visitors: ProfileVisitorInfo[]; totalViews: number; uniqueViewersCount: number }> {
  try {
    const [views, totalViews] = await Promise.all([
      prisma.profileView.findMany({
        where: { targetId, targetType },
        orderBy: { createdAt: 'desc' },
        take: limit * 2, // fetch extra to filter known unique
      }),
      prisma.profileView.count({ where: { targetId, targetType } }),
    ]);

    const knownViewerIds = Array.from(new Set(views.map((v) => v.viewerId).filter(Boolean))) as string[];

    const users = await prisma.user.findMany({
      where: { id: { in: knownViewerIds } },
      select: {
        id: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        teacherProfile: { select: { id: true } },
        studentProfile: { select: { id: true } },
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const visitors: ProfileVisitorInfo[] = [];
    const seenUsers = new Set<string>();

    for (const v of views) {
      if (!v.viewerId) continue;
      if (seenUsers.has(v.viewerId)) continue;
      seenUsers.add(v.viewerId);

      const u = userMap.get(v.viewerId);
      if (!u) continue;

      let profileUrl: string | null = null;
      if (u.role === 'TEACHER' && u.teacherProfile) {
        profileUrl = `/teachers/${u.teacherProfile.id}`;
      } else if (u.role === 'STUDENT') {
        profileUrl = `/students/${u.id}`;
      }

      visitors.push({
        id: v.id,
        visitorId: u.id,
        visitorName: u.fullName,
        visitorRole: u.role,
        visitorAvatar: u.avatarUrl,
        visitorProfileUrl: profileUrl,
        visitedAt: v.createdAt,
        relativeTimeStr: formatRelativeTime(v.createdAt),
      });

      if (visitors.length >= limit) break;
    }

    return {
      visitors,
      totalViews,
      uniqueViewersCount: seenUsers.size,
    };
  } catch (error) {
    console.error('Failed to get profile visitors:', error);
    return { visitors: [], totalViews: 0, uniqueViewersCount: 0 };
  }
}

/**
 * Record a truthful deduplicated product view
 */
export async function recordProductVisitor(
  productId: string,
  viewerUserId?: string | null,
  ipHash?: string | null
): Promise<void> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { creatorId: true },
    });

    if (!product) return;

    // Ignore self-views by the product owner
    if (viewerUserId && product.creatorId === viewerUserId) return;

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (viewerUserId) {
      const recent = await prisma.productView.findFirst({
        where: {
          productId,
          viewerId: viewerUserId,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recent) return;
    } else if (ipHash) {
      const recent = await prisma.productView.findFirst({
        where: {
          productId,
          ipHash,
          createdAt: { gte: oneHourAgo },
        },
      });
      if (recent) return;
    }

    await prisma.productView.create({
      data: {
        productId,
        viewerId: viewerUserId || null,
        ipHash: ipHash || null,
      },
    });
  } catch (error) {
    console.error('Failed to record product view:', error);
  }
}

/**
 * Get product visitors and conversion funnel analytics
 */
export async function getProductVisitors(
  productId: string,
  limit: number = 20
): Promise<{
  totalViews: number;
  uniqueViewersCount: number;
  contactRequestsCount: number;
  visitors: ProductVisitorInfo[];
}> {
  try {
    const [views, totalViews, contactRequestsCount] = await Promise.all([
      prisma.productView.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        take: limit * 2,
      }),
      prisma.productView.count({ where: { productId } }),
      prisma.productContactRequest.count({ where: { productId } }),
    ]);

    const knownViewerIds = Array.from(new Set(views.map((v) => v.viewerId).filter(Boolean))) as string[];

    const users = await prisma.user.findMany({
      where: { id: { in: knownViewerIds } },
      select: {
        id: true,
        fullName: true,
        role: true,
        avatarUrl: true,
      },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));
    const visitors: ProductVisitorInfo[] = [];
    const seenUsers = new Set<string>();

    for (const v of views) {
      if (!v.viewerId) continue;
      if (seenUsers.has(v.viewerId)) continue;
      seenUsers.add(v.viewerId);

      const u = userMap.get(v.viewerId);
      if (!u) continue;

      visitors.push({
        id: v.id,
        visitorId: u.id,
        visitorName: u.fullName,
        visitorRole: u.role,
        visitorAvatar: u.avatarUrl,
        viewedAt: v.createdAt,
        relativeTimeStr: formatRelativeTime(v.createdAt),
      });

      if (visitors.length >= limit) break;
    }

    return {
      totalViews,
      uniqueViewersCount: seenUsers.size,
      contactRequestsCount,
      visitors,
    };
  } catch (error) {
    console.error('Failed to get product visitors:', error);
    return {
      totalViews: 0,
      uniqueViewersCount: 0,
      contactRequestsCount: 0,
      visitors: [],
    };
  }
}
