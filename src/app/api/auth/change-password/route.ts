import { NextResponse } from 'next/server';
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
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
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'كلمة المرور الحالية والجديدة مطلوبتان.' }, { status: 400 });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.' }, { status: 400 });
    }

    if (!/[0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
      return NextResponse.json({ error: 'يجب أن تحتوي كلمة المرور الجديدة على رقم أو رمز خاص.' }, { status: 400 });
    }

    if (newPassword.length > 128) {
      return NextResponse.json({ error: 'كلمة المرور طويلة جداً.' }, { status: 400 });
    }

    // Fetch fresh from DB to verify current hash
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'المستخدم غير موجود.' }, { status: 404 });
    }

    const isValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isValid) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة.' }, { status: 400 });
    }

    // Hash and save — never store plaintext
    const newHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Audit — NO password or hash in details
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: 'PASSWORD_CHANGED',
        target: user.id,
        category: 'SECURITY',
        details: 'Password changed by user',
      },
    });

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح.' });
  } catch (error: any) {
    console.error('[CHANGE_PASSWORD] Error:', error?.message);
    return NextResponse.json({ error: 'فشل تغيير كلمة المرور.' }, { status: 500 });
  }
}
