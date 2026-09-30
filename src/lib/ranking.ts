/**
 * KRYTY Fair Bayesian Teacher Ranking Engine
 *
 * Solves the 5-star (5 reviews) vs 4.8-star (100 reviews) paradox fairly.
 *
 * Formula: Weighted Bayesian Rating Score WR:
 * WR = (v / (v + m)) * R + (m / (v + m)) * C
 *
 * v = Number of student reviews for this teacher
 * m = Confidence threshold parameter (m = 5)
 * R = Raw average rating of this teacher
 * C = Global mean platform rating (C = 4.5)
 */

export interface TeacherRankingInput {
  id: string;
  rawRating: number;
  reviewCount: number;
  reachCount?: number;
  isVerified?: boolean;
}

export interface RankedTeacherResult<T = any> {
  teacher: T;
  rawRating: number;
  reviewCount: number;
  bayesianScore: number;
  rankPosition: number;
  explanation: string;
}

export function calculateBayesianScore(
  rawRating: number,
  reviewCount: number,
  m: number = 5,
  C: number = 3.0
): number {
  if (reviewCount === 0) return 0;
  const score = (reviewCount / (reviewCount + m)) * rawRating + (m / (reviewCount + m)) * C;
  return Math.round(score * 100) / 100;
}

export function rankTeachers<T extends TeacherRankingInput>(
  teachers: T[],
  m: number = 5,
  C: number = 3.0
): RankedTeacherResult<T>[] {
  const scored = teachers.map((t) => {
    const rawRating = t.rawRating || 0;
    const reviewCount = t.reviewCount || 0;
    const score = calculateBayesianScore(rawRating, reviewCount, m, C);

    return {
      teacher: t,
      rawRating,
      reviewCount,
      bayesianScore: score,
      rankPosition: 0,
      explanation: `تصنيف الجودة (${score}): التقييم ${rawRating}★ يستند على ${reviewCount} مراجعة.`,
    };
  });

  // Sort descending by score, breaking ties deterministically by reviewCount then ID
  scored.sort((a, b) => {
    if (b.bayesianScore !== a.bayesianScore) {
      return b.bayesianScore - a.bayesianScore;
    }
    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }
    return String(a.teacher.id).localeCompare(String(b.teacher.id));
  });

  // Assign Rank positions
  return scored.map((item, index) => ({
    ...item,
    rankPosition: index + 1,
  }));
}

// In-Memory 15-minute Ranking Snapshot Cache
let cachedRankingSnapshot: { data: any[]; timestamp: number } | null = null;
const RANKING_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export async function getAllRankedTeachersCached() {
  const now = Date.now();
  if (cachedRankingSnapshot && (now - cachedRankingSnapshot.timestamp < RANKING_CACHE_TTL_MS)) {
    return cachedRankingSnapshot.data;
  }

  const { prisma } = await import('@/lib/db');

  // Query all eligible public teachers
  const candidates = await prisma.teacherProfile.findMany({
    where: {
      subscriptionState: {
        in: ['FREE_ACTIVE', 'PRO_ACTIVE'],
      },
      // Exclude frozen and soft-deleted accounts from all discovery surfaces
      user: {
        isFrozen: false,
        softDeletedAt: null,
      },
    },
    include: {
      user: true,
      reviews: {
        where: { status: 'PUBLISHED' },
        select: { rating: true },
      },
      _count: {
        select: { reviews: true, reachEvents: true },
      },
    },
  });

  const formattedInputs = candidates.map((t) => {
    const publishedReviews = t.reviews || [];
    const count = publishedReviews.length;
    const avg = count > 0 ? publishedReviews.reduce((acc, r) => acc + r.rating, 0) / count : 0;

    return {
      ...t,
      rawRating: Math.round(avg * 10) / 10,
      reviewCount: count,
      isVerified: t.isVerified,
    };
  });

  const ranked = rankTeachers(formattedInputs);
  cachedRankingSnapshot = {
    data: ranked,
    timestamp: now,
  };

  return ranked;
}

export function invalidateRankingCache() {
  cachedRankingSnapshot = null;
}

export async function rankTeachersQuery<T extends TeacherRankingInput>(
  teachers: T[],
  m: number = 5,
  C: number = 3.0
): Promise<RankedTeacherResult<T>[]> {
  return rankTeachers(teachers, m, C);
}

export async function getTopRankedTeachersCached(limit = 30) {
  const all = await getAllRankedTeachersCached();
  return all.slice(0, limit);
}

