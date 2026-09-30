import { prisma } from '@/lib/db';

/**
 * PROF DZ Centralized Bayesian Product Ranking Engine
 *
 * Solves the 5-star (1 review) vs 4.5-star (10 reviews) paradox for educational products.
 *
 * Formula: Weighted Bayesian Rating Score WR:
 * WR = (v / (v + m)) * R + (m / (v + m)) * C
 *
 * v = Number of customer/student reviews for this product
 * m = Confidence threshold parameter (m = 3)
 * R = Raw average rating of this product
 * C = Global baseline rating benchmark (C = 3.0)
 */

export interface ProductRankingInput {
  id: string;
  rawRating: number;
  reviewCount: number;
}

export interface RankedProductResult<T = any> {
  product: T;
  rawRating: number;
  reviewCount: number;
  bayesianScore: number;
  rankPosition: number;
}

export function calculateProductBayesianScore(
  rawRating: number,
  reviewCount: number,
  m: number = 3,
  C: number = 3.0
): number {
  if (reviewCount === 0) return 0;
  const score = (reviewCount / (reviewCount + m)) * rawRating + (m / (reviewCount + m)) * C;
  return Math.round(score * 100) / 100;
}

export function rankProducts<T extends { id: string; ratingAverage?: number | null; reviewCount?: number | null }>(
  products: T[],
  m: number = 3,
  C: number = 3.0
): RankedProductResult<T>[] {
  const scored = products.map((p) => {
    const rawRating = p.ratingAverage || 0;
    const reviewCount = p.reviewCount || 0;
    const score = calculateProductBayesianScore(rawRating, reviewCount, m, C);

    return {
      product: p,
      rawRating,
      reviewCount,
      bayesianScore: score,
      rankPosition: 0,
    };
  });

  // Sort descending by bayesian score, breaking ties by review count then recency/ID
  scored.sort((a, b) => {
    if (b.bayesianScore !== a.bayesianScore) {
      return b.bayesianScore - a.bayesianScore;
    }
    if (b.reviewCount !== a.reviewCount) {
      return b.reviewCount - a.reviewCount;
    }
    return String(a.product.id).localeCompare(String(b.product.id));
  });

  return scored.map((item, index) => ({
    ...item,
    rankPosition: index + 1,
  }));
}
