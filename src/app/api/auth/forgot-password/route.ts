import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';
import { sendEmail } from '@/lib/emailService';
import crypto from 'crypto';

export async function POST(request: Request) {
  const limitRes = await rateLimit(request, 5, 60_000); // 5 per minute
  if (limitRes) return limitRes;

  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return success to prevent user enumeration attacks
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'إذا كان البريد مسجلاً لدينا، ستصل رسالة استعادة كلمة المرور.',
      });
    }

    // Delete any existing reset tokens for this email
    await (prisma as any).passwordResetToken.deleteMany({ where: { email: normalizedEmail } });

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await (prisma as any).passwordResetToken.create({
      data: { email: normalizedEmail, tokenHash, expiresAt },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const resetUrl = baseUrl + '/reset-password?token=' + rawToken;

    await sendEmail({
      to: normalizedEmail,
      subject: 'استعادة كلمة المرور — PROF DZ',
      html: '<div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
        + '<h2 style="color:#0ea5e9;">استعادة كلمة المرور</h2>'
        + '<p>طلبت إعادة تعيين كلمة المرور لحسابك على منصة <strong>PROF DZ</strong>.</p>'
        + '<p>اضغط على الرابط أدناه (صالح ساعة واحدة):</p>'
        + '<a href="' + resetUrl + '" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">إعادة تعيين كلمة المرور</a>'
        + '<p style="color:#666;font-size:12px;">إذا لم تطلب هذا، تجاهل هذا البريد.</p>'
        + '</div>',
    });

    return NextResponse.json({
      success: true,
      message: 'إذا كان البريد مسجلاً لدينا، ستصل رسالة استعادة كلمة المرور.',
      devLink: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'حدث خطأ. يرجى المحاولة لاحقاً.' }, { status: 500 });
  }
}

