import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [recentPosts, recentReviews, recentProducts, recentTeachers, topTeachers, popularSubjects] = await Promise.all([
      prisma.post.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              fullName: true,
              avatarUrl: true,
              role: true,
            },
          },
        },
      }),
      prisma.review.findMany({
        where: { status: 'PUBLISHED' },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { fullName: true, avatarUrl: true } },
          teacher: { include: { user: { select: { fullName: true } } } },
        },
      }),
      prisma.product.findMany({
        where: { isPublished: true },
        take: 3,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.teacherProfile.findMany({
        where: { subscriptionState: { in: ['FREE_ACTIVE', 'PRO_ACTIVE'] } },
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { fullName: true, avatarUrl: true, wilaya: true } },
        },
      }),
      prisma.teacherProfile.findMany({
        where: { subscriptionState: { in: ['FREE_ACTIVE', 'PRO_ACTIVE'] } },
        take: 5,
        orderBy: { experienceYears: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              wilaya: true,
            },
          },
          _count: {
            select: { reviews: true, reachEvents: true },
          },
        },
      }),
      prisma.teacherProfile.findMany({
        select: { subjects: true },
        take: 20,
      }),
    ]);

    const events: Array<{
      id: string;
      type: 'post' | 'review' | 'product' | 'teacher';
      label: string;
      name: string;
      href: string;
      time: string;
      extra?: string;
    }> = [];

    recentPosts.forEach((p) => {
      events.push({
        id: 'post-' + p.id,
        type: 'post',
        label: p.title ? `بدأ نقاشاً: ${p.title}` : 'نشر فكرة تعليمية جديدة',
        name: p.author.fullName,
        href: '/feed',
        time: formatTimeDiff(p.createdAt),
      });
    });

    recentReviews.forEach((r) => {
      const teacherName = r.teacher?.user?.fullName || 'أستاذ معتمد';
      events.push({
        id: 'review-' + r.id,
        type: 'review',
        label: `قيّم الأستاذ ${teacherName} بـ ${r.rating}★`,
        name: r.author.fullName,
        href: `/teachers/${r.targetId}`,
        time: formatTimeDiff(r.createdAt),
      });
    });

    recentProducts.forEach((prod) => {
      events.push({
        id: 'product-' + prod.id,
        type: 'product',
        label: `نشر محتوى جديد: ${prod.title}`,
        name: prod.creatorName || 'أستاذ',
        href: `/products/${prod.slug}`,
        time: formatTimeDiff(prod.createdAt),
      });
    });

    recentTeachers.forEach((t) => {
      events.push({
        id: 'teacher-' + t.id,
        type: 'teacher',
        label: `انضم حديثاً من ${t.user.wilaya || 'الجزائر'}`,
        name: t.user.fullName,
        href: `/teachers/${t.id}`,
        time: formatTimeDiff(t.createdAt),
      });
    });

    const subjectSet = new Set<string>();
    popularSubjects.forEach((s) => {
      try {
        const parsed = JSON.parse(s.subjects || '[]');
        if (Array.isArray(parsed)) parsed.forEach((item) => subjectSet.add(item));
      } catch {
        if (s.subjects) subjectSet.add(s.subjects);
      }
    });

    const tags = Array.from(subjectSet).slice(0, 10);
    if (tags.length === 0) {
      tags.push('رياضيات', 'فيزياء', 'علوم الطبيعة', 'فلسفة', 'لغة عربية', 'فرنسية', 'إنجليزية');
    }

    return NextResponse.json({
      success: true,
      events: events.slice(0, 7),
      trendingTeachers: topTeachers.map((t) => ({
        id: t.id,
        fullName: t.user.fullName,
        avatarUrl: t.user.avatarUrl,
        subject: (() => {
          try {
            const arr = JSON.parse(t.subjects || '[]');
            return Array.isArray(arr) && arr[0] ? arr[0] : 'أستاذ';
          } catch {
            return t.subjects || 'أستاذ';
          }
        })(),
        rating: t.ratingAverage || 4.5,
        reviewCount: t._count?.reviews || 0,
        activityCount: (t._count?.reviews || 0) + (t._count?.reachEvents || 0),
      })),
      popularTags: tags,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function formatTimeDiff(date: Date): string {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return 'منذ ' + diffMins + ' دقيقة';
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return 'منذ ' + diffHours + ' ساعة';
  const diffDays = Math.floor(diffHours / 24);
  return 'منذ ' + diffDays + ' يوم';
}
