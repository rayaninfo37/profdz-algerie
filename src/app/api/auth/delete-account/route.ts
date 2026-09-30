import { NextResponse } from 'next/server';
import { getCurrentUser, clearSessionCookie, verifyPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

/**
 * GDPR-style account deletion endpoint.
 * Requires the user to confirm with their password.
 * All cascade-delete relations handle associated data removal automatically.
 */
export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 5, 60_000); // very strict: 5 per minute
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول لحذف الحساب.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { password, confirmation } = body;

    // Require explicit confirmation string
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json({
        error: 'يجب تأكيد الحذف بكتابة DELETE_MY_ACCOUNT في حقل التأكيد.',
      }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'كلمة المرور مطلوبة لتأكيد حذف الحساب.' }, { status: 400 });
    }

    // Verify password before deletion
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'كلمة المرور غير صحيحة.' }, { status: 401 });
    }

    // Soft delete user with 7 days grace period
    const now = new Date();
    const graceEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        softDeletedAt: now,
        restorableUntil: graceEnd,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'USER_SELF_SOFT_DELETE',
        target: user.id,
        category: 'SECURITY',
        details: `User self-deleted their account. Restorable until ${graceEnd.toISOString()}`,
      },
    });

    // Invalidate ranking cache to immediately hide teacher from discovery
    const { invalidateRankingCache } = await import('@/lib/ranking');
    invalidateRankingCache();

    // Clear session cookie
    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'تم حذف حسابك مؤقتاً. لديك مهلة 7 أيام لاسترجاعه بالتواصل مع الإدارة قبل الحذف النهائي.',
      restorableUntil: graceEnd.toISOString(),
    });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء حذف الحساب. يرجى المحاولة لاحقاً.' }, { status: 500 });
  }
}
