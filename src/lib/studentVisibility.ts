import { prisma } from '@/lib/db';

/**
 * Generate human-readable public student URL slug:
 * Format: clean-name-shortId (e.g. "mohamed-ali-x8k2")
 */
export function generateStudentSlug(fullName: string, id: string): string {
  const cleanName = (fullName || 'student')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, '')
    .replace(/\s+/g, '-');
  const shortId = id.substring(0, 6);
  return `${cleanName}-${shortId}`;
}

/**
 * Find student profile by studentProfileId or slug, or by userId
 */
export async function findStudentByIdOrSlug(idOrSlug: string, include?: any): Promise<any | null> {
  const defaultInclude = include || {
    user: {
      select: {
        id: true,
        fullName: true,
        avatarUrl: true,
        wilaya: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true,
            likes: true,
            following: true,
            follows: true,
          },
        },
      },
    },
  };

  // 1. Direct ID lookup on studentProfile
  const byStudentId = await prisma.studentProfile.findUnique({
    where: { id: idOrSlug },
    include: defaultInclude,
  });
  if (byStudentId) return byStudentId;

  // 2. Direct lookup on user ID
  const byUserId = await prisma.studentProfile.findUnique({
    where: { userId: idOrSlug },
    include: defaultInclude,
  });
  if (byUserId) return byUserId;

  // 3. Slug lookup: extract shortId from end of slug
  const parts = idOrSlug.split('-');
  const possibleShortId = parts[parts.length - 1];
  if (possibleShortId && possibleShortId.length >= 4) {
    const candidate = await prisma.studentProfile.findFirst({
      where: {
        OR: [
          { id: { startsWith: possibleShortId } },
          { userId: { startsWith: possibleShortId } },
        ],
      },
      include: defaultInclude,
    });
    if (candidate) return candidate;
  }

  return null;
}

/**
 * Calculate bounded student community activity score:
 * Logarithmic dampening on counts so extreme single metrics cannot unfairly dominate.
 * Score = ln(1 + followers)*3.0 + ln(1 + posts)*2.5 + ln(1 + comments)*1.5 + ln(1 + likes)*1.0
 */
export function calculateStudentCommunityScore(counts: {
  follows: number;
  posts: number;
  comments: number;
  likes: number;
}): number {
  const followScore = Math.log1p(counts.follows || 0) * 3.0;
  const postScore = Math.log1p(counts.posts || 0) * 2.5;
  const commentScore = Math.log1p(counts.comments || 0) * 1.5;
  const likeScore = Math.log1p(counts.likes || 0) * 1.0;

  const total = followScore + postScore + commentScore + likeScore;
  return Math.round(total * 100) / 100;
}
