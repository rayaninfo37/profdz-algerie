import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';
import { resolveTeacherEntitlement } from '@/lib/subscriptionEntitlement';
import { getProPrice, getSubscriptionDuration } from '@/lib/config';

/**
 * GET  /api/subscriptions  — Returns the authenticated teacher'\''s full subscription status.
 * PATCH /api/subscriptions — Admin-only: update subscription status (activate/deactivate).
 */
export async function GET(request: Request) {
  const limitRes = await rateLimit(request);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول.' }, { status: 401 });
    }

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'هذه الخدمة مخصصة للأساتذة فقط.' }, { status: 403 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: 'الملف الشخصي للأستاذ غير موجود.' }, { status: 404 });
    }

    const entitlement = await resolveTeacherEntitlement(teacherProfile.id);

    return NextResponse.json({ success: true, subscription: entitlement });
  } catch (error: any) {
    console.error('Subscription GET error:', error);
    return NextResponse.json({ error: 'فشل في استرجاع معلومات الاشتراك.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const limitRes = await rateLimit(request, 10, 60_000);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'هذه العملية مخصصة للمشرفين فقط.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { teacherId, status, expiresAt, paymentRef } = body;

    if (!teacherId || !status) {
      return NextResponse.json({ error: 'معرّف الأستاذ والحالة مطلوبان.' }, { status: 400 });
    }

    const validStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'حالة الاشتراك غير صالحة.' }, { status: 400 });
    }

    const teacher = await prisma.teacherProfile.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      return NextResponse.json({ error: 'الأستاذ غير موجود.' }, { status: 404 });
    }

    if (status === 'ACTIVE') {
      const [dynamicDuration, dynamicPrice] = await Promise.all([
        getSubscriptionDuration(),
        getProPrice(),
      ]);
      const newExpiry = expiresAt
        ? new Date(expiresAt)
        : new Date(Date.now() + dynamicDuration * 24 * 60 * 60 * 1000);

      // Expire all previous active subscriptions
      await prisma.subscription.updateMany({
        where: { teacherId, status: 'ACTIVE' },
        data: { status: 'EXPIRED' },
      });

      const subscription = await prisma.subscription.create({
        data: {
          teacherId,
          plan: `PRO_${dynamicPrice}_${dynamicDuration}DAYS`,
          amount: dynamicPrice,
          status: 'ACTIVE',
          startedAt: new Date(),
          expiresAt: newExpiry,
          paymentRef: paymentRef || null,
        },
      });

      await prisma.teacherProfile.update({
        where: { id: teacherId },
        data: { subscriptionState: 'PRO_ACTIVE' },
      });

      return NextResponse.json({ success: true, subscription });
    } else {
      await prisma.subscription.updateMany({
        where: { teacherId, status: 'ACTIVE' },
        data: { status },
      });

      await prisma.teacherProfile.update({
        where: { id: teacherId },
        data: { subscriptionState: status === 'EXPIRED' ? 'PRO_EXPIRED' : 'FROZEN' },
      });

      return NextResponse.json({ success: true, message: 'تم تحديث حالة الاشتراك.' });
    }
  } catch (error: any) {
    console.error('Subscription PATCH error:', error);
    return NextResponse.json({ error: 'فشل في تحديث الاشتراك.' }, { status: 500 });
  }
}
