import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { validateAlgerianPhone } from '@/lib/algerianPhone';
import { rateLimit } from '@/middleware/rateLimitMiddleware';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 5, 60_000);
  if (limitRes) return limitRes;

  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (user.isFrozen) {
      return NextResponse.json({ error: 'حسابك مجمّد. تواصل مع الإدارة.' }, { status: 403 });
    }
    if (user.softDeletedAt) {
      return NextResponse.json({ error: 'هذا الحساب تم حذفه.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const rawPhone = body.phone || body.newPhone;

    if (!rawPhone || !String(rawPhone).trim()) {
      return NextResponse.json({ error: 'رقم الهاتف مطلوب.' }, { status: 400 });
    }

    const phoneVal = validateAlgerianPhone(String(rawPhone), false);
    if (!phoneVal.isValid) {
      return NextResponse.json({ error: phoneVal.error || 'رقم الهاتف غير صالح.' }, { status: 400 });
    }

    const normalized = phoneVal.normalizedPhone!;

    // Enforce global uniqueness (DB constraint + explicit check for clear error)
    const existing = await prisma.user.findFirst({
      where: { phone: normalized, NOT: { id: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: 'رقم الهاتف مستخدم من قِبَل حساب آخر.' }, { status: 409 });
    }

    // Update phone transactionally for User and TeacherProfile (if applicable) + reset verification
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          phone: normalized,
          isPhoneVerified: false,
        },
      });

      // Synchronize teacher profile phone if exists
      const teacher = await tx.teacherProfile.findUnique({
        where: { userId: user.id },
      });
      if (teacher) {
        await tx.teacherProfile.update({
          where: { id: teacher.id },
          data: { phone: normalized },
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: user.id,
          action: 'PHONE_CHANGED',
          target: user.id,
          category: 'SECURITY',
          details: 'Phone number changed and synchronized across user and teacher profile',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير رقم الهاتف. يرجى التحقق من الرقم الجديد.',
    });
  } catch (error: any) {
    console.error('[CHANGE_PHONE] Error:', error?.message);
    return NextResponse.json({ error: 'فشل تغيير رقم الهاتف.' }, { status: 500 });
  }
}
