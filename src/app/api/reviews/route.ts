import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ReviewStatus } from '@/types';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    const targetType = searchParams.get('targetType') || 'TEACHER';
    const takeParam = searchParams.get('take');
    const skipParam = searchParams.get('skip');
    const take = takeParam ? Math.min(Math.max(parseInt(takeParam, 10) || 20, 1), 100) : 50;
    const skip = skipParam ? Math.max(parseInt(skipParam, 10) || 0, 0) : 0;

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 });
    }

    const where = {
      targetId,
      targetType,
      status: ReviewStatus.PUBLISHED,
    };

    const [totalCount, allRatings, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({ where, select: { rating: true } }),
      prisma.review.findMany({
        where,
        include: {
          author: {
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
      ? Math.round((allRatings.reduce((sum, r) => sum + r.rating, 0) / totalCount) * 10) / 10
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
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 10, 60_000); // 10 review attempts per minute per IP
  if (limitRes) return limitRes;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to submit reviews' }, { status: 401 });
    }

    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { targetId, targetType, rating, comment } = body;

    const numericRating = parseInt(rating, 10);
    const trimmedComment = comment ? String(comment).trim() : '';

    if (!targetId || isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'يرجى تقديم تقييم صحيح من 1 إلى 5 نجوم.' }, { status: 400 });
    }

    // 1. Mandatory Comment Guardrail: Comments are strictly mandatory for all reviews
    if (!trimmedComment || trimmedComment.length < 5) {
      return NextResponse.json({
        error: 'كتابة تعليق توضيحي إلزامية لجميع التقييمات (5 أحرف على الأقل).',
      }, { status: 400 });
    }

    // Guardrail for low ratings: 1-star and 2-star reviews require at least 20 characters constructive explanation
    if (numericRating <= 2 && trimmedComment.length < 20) {
      return NextResponse.json({
        error: 'التقييمات ذات النجمة أو النجمتين تتطلب شرحاً توضيحياً لا يقل عن 20 حرفاً لضمان النقد البنّاء ومساعدة الأستاذ على التحسين.',
      }, { status: 400 });
    }

    // 2. Anti-Abuse Rate Limit: Max 3 reviews per hour per user
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentReviewsCount = await prisma.review.count({
      where: {
        authorId: user.id,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentReviewsCount >= 3) {
      return NextResponse.json({
        error: 'لقد بلغت الحد الأقصى للمراجعات في الساعة (3 تقييمات). يرجى المحاولة بعد قليل.',
      }, { status: 429 });
    }

    // 3. Prevent self‑review (author reviewing own profile)
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: targetId },
      select: { userId: true },
    });
    if (teacher && teacher.userId === user.id) {
      return NextResponse.json({ error: 'لا يمكنك تقييم ملفك الشخصي.' }, { status: 400 });
    }

    // 4. Prevent duplicate reviews by same author on same target
    const existing = await prisma.review.findFirst({
      where: { authorId: user.id, targetId },
    });
    if (existing) {
      return NextResponse.json({ error: 'لقد قمت بتقييم هذا الأستاذ مسبقاً. يُسمح بتقييم واحد لكل أستاذ.' }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        targetId,
        targetType: targetType || 'TEACHER',
        authorId: user.id,
        rating: numericRating,
        comment: trimmedComment,
        status: ReviewStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Update denormalized rating fields on the teacher profile
    if (targetType === 'TEACHER' || !targetType) {
      try {
        const agg = await prisma.review.aggregate({
          where: { targetId, targetType: 'TEACHER', status: ReviewStatus.PUBLISHED },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await prisma.teacherProfile.update({
          where: { id: targetId },
          data: {
            ratingAverage: agg._avg.rating ?? 0,
            reviewCount: agg._count.rating,
          },
        });
      } catch (e) {}
    }

    // If review target is a teacher, notify the teacher
    if (targetType === 'TEACHER') {
      const teacher = await prisma.teacherProfile.findUnique({
        where: { id: targetId },
        select: { userId: true },
      });
      if (teacher && teacher.userId !== user.id) {
        try {
          await prisma.notification.create({
            data: {
              userId: teacher.userId,
              title: 'تقييم ومراجعة جديدة (New Teacher Review)',
              message: `قام ${user.fullName} بتقديم تقييم ${rating} نجوم على ملفك الشخصي.`,
              type: 'REVIEW',
            },
          });
        } catch (e) {}
      }

      // Invalidate the ranking snapshot cache so ranking immediately reflects the new review
      try {
        const { invalidateRankingCache } = await import('@/lib/ranking');
        invalidateRankingCache();
      } catch (e) {}
    }

    return NextResponse.json({ success: true, review });
  } catch (error: any) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const limitRes = await rateLimit(request, 10, 60_000);
  if (limitRes) return limitRes;
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لحذف التقييم.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json({ error: 'معرّف التقييم مطلوب.' }, { status: 400 });
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) {
      return NextResponse.json({ error: 'التقييم غير موجود.' }, { status: 404 });
    }

    // IDOR protection: only author or ADMIN can delete
    if (review.authorId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'غير مصرح لك بحذف هذا التقييم.' }, { status: 403 });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    // Update denormalized rating fields
    if (review.targetType === 'TEACHER') {
      try {
        const agg = await prisma.review.aggregate({
          where: { targetId: review.targetId, targetType: 'TEACHER', status: ReviewStatus.PUBLISHED },
          _avg: { rating: true },
          _count: { rating: true },
        });
        await prisma.teacherProfile.update({
          where: { id: review.targetId },
          data: {
            ratingAverage: agg._avg.rating ?? 0,
            reviewCount: agg._count.rating,
          },
        });
      } catch (e) {}
    }

    return NextResponse.json({ success: true, message: 'تم حذف التقييم بنجاح.' });
  } catch (error: any) {
    console.error('Delete review error:', error);
    return NextResponse.json({ error: 'فشل في حذف التقييم.' }, { status: 500 });
  }
}
