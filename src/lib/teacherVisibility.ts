import { prisma } from '@/lib/db';
import { SubscriptionState } from '@/types';

/**
 * Public Discoverability Criteria:
 * A teacher is eligible for public discovery (Home, Search, Directory, Ranking, etc.) if:
 * 1. Their account is NOT FROZEN (they haven't exceeded the free limit without renewing).
 * 2. Subscription state is FREE_ACTIVE or PRO_ACTIVE (or PRO_EXPIRED with reach < freeLimit).
 * 3. Not blocked or banned by admin.
 *
 * Note: Verification is NOT a prerequisite for discovery, but frozen/ineligible teachers must be hidden.
 */

export function getPublicTeacherWhereClause(): any {
  return {
    subscriptionState: {
      in: [SubscriptionState.FREE_ACTIVE, SubscriptionState.PRO_ACTIVE],
    },
    user: {
      isFrozen: false,
      softDeletedAt: null,
    },
  };
}

export function isPubliclyDiscoverable(teacher: {
  subscriptionState: string;
  user?: { isFrozen?: boolean; softDeletedAt?: any } | null;
}): boolean {
  if (teacher.user?.isFrozen || teacher.user?.softDeletedAt) {
    return false;
  }
  return (
    teacher.subscriptionState === SubscriptionState.FREE_ACTIVE ||
    teacher.subscriptionState === SubscriptionState.PRO_ACTIVE
  );
}

/**
 * Generate stable, clean URL slug from full name and ID
 * Example: "Ahmed Benali" + id "12345678-..." -> "ahmed-benali-1234"
 */
export function generateTeacherSlug(fullName: string, id: string): string {
  const cleanName = (fullName || 'teacher')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '') // Keep Arabic letters, English letters, numbers
    .replace(/\s+/g, '-');
  const shortId = id.substring(0, 6);
  return `${cleanName}-${shortId}`;
}

/**
 * Find teacher by ID or by generated slug
 */
export async function findTeacherByIdOrSlug(idOrSlug: string, include?: any): Promise<any | null> {
  // If it's a UUID or direct ID match
  const byId = await prisma.teacherProfile.findUnique({
    where: { id: idOrSlug },
    include: include || { user: true },
  });

  if (byId) return byId;

  // Otherwise, match short ID at the end of the slug
  const parts = idOrSlug.split('-');
  const possibleShortId = parts[parts.length - 1];

  if (possibleShortId && possibleShortId.length >= 4) {
    const candidate = await prisma.teacherProfile.findFirst({
      where: {
        id: { startsWith: possibleShortId },
      },
      include: include || { user: true },
    });
    if (candidate) return candidate;
  }

  return null;
}
