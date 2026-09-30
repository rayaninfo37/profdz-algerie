import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rateLimit } from '@/middleware/rateLimitMiddleware';
import { sendEmail } from '@/lib/emailService';
import crypto from 'crypto';

export async function GET(request: Request) {
  const limitRes = await rateLimit(request);
  if (limitRes) return limitRes;
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'رمز تأكيد البريد الإلكتروني مطلوب.' }, { status: 400 });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expiresAt < new Date()) {
      return NextResponse.json({ error: 'رمز التأكيد غير صالح أو منتهي الصلاحية.' }, { status: 400 });
    }

    // Mark user as emailVerified
    await prisma.user.updateMany({
      where: { email: record.email },
      data: { isEmailVerified: true },
    });

    // Delete used token
    await prisma.emailVerificationToken.delete({
      where: { id: record.id },
    });

    return NextResponse.json({
      success: true,
      message: 'تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن استخدام كافة ميزات المنصة.',
    });
  } catch (error: any) {
    console.error('Email verification error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء تأكيد البريد.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const limitRes = await rateLimit(request);
  if (limitRes) return limitRes;
  try {
    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'بريد إلكتروني غير صالح.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return NextResponse.json({ error: 'لا يوجد حساب مرتبط بهذا البريد.' }, { status: 404 });
    }

    if (user.isEmailVerified) {
      return NextResponse.json({ message: 'البريد الإلكتروني مؤكد بالفعل.' });
    }

    // Generate random raw token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Clean old tokens for this email and save new one
    await prisma.emailVerificationToken.deleteMany({
      where: { email: normalizedEmail },
    });

    await prisma.emailVerificationToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      },
    });

    // Send verification email (uses SendGrid in production, logs in development)
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}`;
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: 'تأكيد بريدك الإلكتروني — PROF DZ',
        html: `
          <div dir="rtl" style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
            <h2 style="color:#0ea5e9;">تأكيد البريد الإلكتروني</h2>
            <p>مرحباً بك في منصة <strong>PROF DZ</strong>!</p>
            <p>اضغط على الرابط أدناه لتأكيد بريدك الإلكتروني (صالح لمدة 24 ساعة):</p>
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;">تأكيد البريد الإلكتروني</a>
            <p style="color:#666;font-size:12px;">إذا لم تقم بإنشاء حساب، تجاهل هذا البريد.</p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[EMAIL] Failed to send verification email:', emailErr);
    }

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء وإرسال رابط تأكيد البريد الإلكتروني بنجاح.',
      devLink: process.env.NODE_ENV !== 'production' ? verifyUrl : undefined,
    });
  } catch (error: any) {
    console.error('Send email verification error:', error);
    return NextResponse.json({ error: 'حدث خطأ أثناء إرسال رابط التأكيد.' }, { status: 500 });
  }
}