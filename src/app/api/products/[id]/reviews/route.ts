import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;
    const { searchParams } = new URL(request.url);
    const take = Math.min(Math.max(parseInt(searchParams.get('take') || '20', 10), 1), 50);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const where = {
      productId,
      status: 'PUBLISHED',
    };

    const [totalCount, allReviews, reviews] = await Promise.all([
      prisma.productReview.count({ where }),
      prisma.productReview.findMany({ where, select: { rating: true } }),
      prisma.productReview.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              wilaya: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
    ]);

    const averageRating = totalCount > 0
      ? Math.round((allReviews.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
      : 0;

    return NextResponse.json({
      success: true,
      reviews,
      totalCount,
      averageRating,
      pagination: {
        total: totalCount,
        take,
        skip,
        hasMore: skip + reviews.length < totalCount,
      },
    });
  } catch (error: any) {
    console.error('Fetch product reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch product reviews' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limitRes = await rateLimit(request, 10, 60_000);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لإضافة تقييم للمنتج.' }, { status: 401 });
    }

    const { id: productId } = await params;
    const body = await request.json().catch(() => ({}));
    const { rating, comment } = body;

    const numericRating = parseInt(rating, 10);
    const trimmedComment = comment ? String(comment).trim() : '';

    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'يرجى تقديم تقييم صحيح من 1 إلى 5 نجوم.' }, { status: 400 });
    }

    if (!trimmedComment || trimmedComment.length < 5) {
      return NextResponse.json({ error: 'كتابة تعليق توضيحي إلزامية (5 أحرف على الأقل).' }, { status: 400 });
    }

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    if (!product) {
      return NextResponse.json({ error: 'المنتج غير موجود.' }, { status: 404 });
    }

    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    // Prevent product owner from reviewing their own product
    const isProductCreator = product.creatorId === user.id || (user.teacherProfile && product.creatorId === user.teacherProfile.id);
    if (isProductCreator) {
      return NextResponse.json({ error: 'لا يمكنك تقييم منتجك الخاص.' }, { status: 400 });
    }

    // Prevent duplicate reviews
    const existing = await prisma.productReview.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: user.id,
        },
      },
    });
    if (existing) {
      return NextResponse.json({ error: 'لقد قمت بتقييم هذا المنتج مسبقاً.' }, { status: 400 });
    }

    // Anti-abuse: max 5 reviews per hour across the platform
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.productReview.count({
      where: {
        userId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    });
    if (recentCount >= 5) {
      return NextResponse.json({ error: 'لقد بلغت الحد الأقصى للمراجعات في الساعة. يرجى المحاولة لاحقاً.' }, { status: 429 });
    }

    const newReview = await prisma.productReview.create({
      data: {
        productId,
        userId: user.id,
        rating: numericRating,
        comment: trimmedComment,
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            wilaya: true,
          },
        },
      },
    });

    // Recalculate denormalized rating on Product
    const agg = await prisma.productReview.aggregate({
      where: { productId, status: 'PUBLISHED' },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.rating,
      },
    });

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: any) {
    console.error('Create product review error:', error);
    return NextResponse.json({ error: 'فشل في حفظ التقييم.' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limitRes = await rateLimit(request, 10, 60_000);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لتعديل التقييم.' }, { status: 401 });
    }

    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    const { id: productId } = await params;
    const body = await request.json().catch(() => ({}));
    const { rating, comment } = body;

    // Validate rating if provided
    if (rating !== undefined) {
      const numRating = parseInt(String(rating), 10);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return NextResponse.json({ error: 'التقييم يجب أن يكون بين 1 و 5.' }, { status: 400 });
      }
    }

    // Find existing review — ownership enforced by userId: user.id
    const existing = await prisma.productReview.findUnique({
      where: {
        productId_userId: {
          productId,
          userId: user.id,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'لم تقم بتقييم هذا المنتج بعد.' }, { status: 404 });
    }

    // Update review
    const updated = await prisma.productReview.update({
      where: { id: existing.id },
      data: {
        ...(rating !== undefined ? { rating: parseInt(String(rating), 10) } : {}),
        ...(comment !== undefined ? { comment: String(comment).trim().substring(0, 2000) } : {}),
      },
      include: {
        user: {
          select: { id: true, fullName: true, avatarUrl: true, wilaya: true },
        },
      },
    });

    // Recalculate product rating aggregate
    const agg = await prisma.productReview.aggregate({
      where: { productId, status: 'PUBLISHED' },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await prisma.product.update({
      where: { id: productId },
      data: {
        ratingAverage: Math.round((agg._avg.rating ?? 0) * 10) / 10,
        reviewCount: agg._count.rating,
      },
    });

    // Invalidate teacher ranking cache (product ratings affect product ranking)
    const { invalidateRankingCache } = await import('@/lib/ranking');
    invalidateRankingCache();

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error('Update product review error:', error);
    return NextResponse.json({ error: 'فشل في تعديل التقييم.' }, { status: 500 });
  }
}
