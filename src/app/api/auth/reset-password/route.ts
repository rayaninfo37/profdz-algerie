import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, clearSessionCookie } from '@/lib/auth';
import { rateLimit } from '@/middleware/rateLimitMiddleware';
import crypto from 'crypto';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 10, 60_000);
  if (limitRes) return limitRes;

  try {
    const body = await request.json().catch(() => ({}));
    const { token, newPassword } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'رمز إعادة التعيين مطلوب.' }, { status: 400 });
    }

    // Password strength: min 8 chars + at least 1 number or special char
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({
        error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.',
      }, { status: 400 });
    }
    const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{};':\\|,.<>\/?]/.test(newPassword);
 if (!hasNumberOrSpecial) {
 return NextResponse.json({
 error: 'كلمة المرور يجب أن تحتوي على رقم أو رمز خاص على الأقل.',
 }, { status: 400 });
 }

 const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
 const record = await (prisma as any).passwordResetToken.findUnique({ where: { tokenHash } });

 if (!record || record.expiresAt < new Date()) {
 return NextResponse.json({ error: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية.' }, { status: 400 });
 }

 const passwordHash = await hashPassword(newPassword);
 await prisma.user.update({
 where: { email: record.email },
 data: { passwordHash },
 });

 // Delete used token
 await (prisma as any).passwordResetToken.delete({ where: { id: record.id } });

 // Invalidate session (user must re-login)
 await clearSessionCookie();

 return NextResponse.json({
 success: true,
 message: 'تم إعادة تعيين كلمة المرور بنجاح. يرجى تسجيل الدخول بكلمة المرور الجديدة.',
 });
 } catch (error: any) {
 console.error('Reset password error:', error);
 return NextResponse.json({ error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور.' }, { status: 500 });
 }
}
